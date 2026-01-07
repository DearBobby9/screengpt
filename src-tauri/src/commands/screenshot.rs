use base64::{engine::general_purpose::STANDARD, Engine};
use image::ImageFormat;
use std::io::Cursor;
use xcap::Monitor;

#[derive(Debug, serde::Serialize)]
pub struct ScreenshotResult {
    pub base64: String,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub async fn capture_full_screen() -> Result<ScreenshotResult, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let primary = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .or_else(|| Monitor::all().ok()?.into_iter().next())
        .ok_or("No monitor found")?;

    let image = primary.capture_image().map_err(|e| e.to_string())?;
    let (width, height) = (image.width(), image.height());

    // Resize if too large (max 2048px on longest side)
    let image = if width > 2048 || height > 2048 {
        let scale = 2048.0 / width.max(height) as f32;
        let new_width = (width as f32 * scale) as u32;
        let new_height = (height as f32 * scale) as u32;
        image::imageops::resize(&image, new_width, new_height, image::imageops::FilterType::Lanczos3)
    } else {
        image::DynamicImage::ImageRgba8(image).to_rgba8()
    };

    let mut buffer = Cursor::new(Vec::new());
    image
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let base64 = STANDARD.encode(buffer.get_ref());

    Ok(ScreenshotResult {
        base64,
        width: image.width(),
        height: image.height(),
    })
}

#[derive(Debug, serde::Deserialize)]
pub struct Region {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub async fn capture_region(region: Region) -> Result<ScreenshotResult, String> {
    // Validate region dimensions
    if region.width == 0 || region.height == 0 {
        return Err("Invalid region: width and height must be greater than 0".to_string());
    }

    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    // Try to find the monitor that contains the region, fallback to primary
    let target_monitor = monitors
        .iter()
        .find(|m| {
            if let (Ok(mx), Ok(my), Ok(mw), Ok(mh)) = (m.x(), m.y(), m.width(), m.height()) {
                let mx = mx as i32;
                let my = my as i32;
                let mw = mw as i32;
                let mh = mh as i32;
                region.x >= mx && region.y >= my &&
                region.x < mx + mw && region.y < my + mh
            } else {
                false
            }
        })
        .or_else(|| monitors.iter().find(|m| m.is_primary().unwrap_or(false)))
        .or_else(|| monitors.first())
        .ok_or("No monitor found")?;

    let full_image = target_monitor.capture_image().map_err(|e| e.to_string())?;

    // Calculate offset relative to this monitor
    let monitor_x = target_monitor.x().unwrap_or(0) as i32;
    let monitor_y = target_monitor.y().unwrap_or(0) as i32;

    // Crop to region (adjust for monitor offset)
    let x = (region.x - monitor_x).max(0) as u32;
    let y = (region.y - monitor_y).max(0) as u32;
    let width = region.width.min(full_image.width().saturating_sub(x));
    let height = region.height.min(full_image.height().saturating_sub(y));

    if width == 0 || height == 0 {
        return Err("Region is outside of visible screen area".to_string());
    }

    let cropped = image::imageops::crop_imm(&full_image, x, y, width, height).to_image();

    let mut buffer = Cursor::new(Vec::new());
    cropped
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let base64 = STANDARD.encode(buffer.get_ref());

    Ok(ScreenshotResult {
        base64,
        width: cropped.width(),
        height: cropped.height(),
    })
}
