use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AyisConfig {
    pub api_base: String,
    pub app_version: String,
}

impl Default for AyisConfig {
    fn default() -> Self {
        Self {
            api_base: "http://localhost:8000/api/v1".to_string(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

pub struct AyisState {
    pub config: Mutex<AyisConfig>,
    pub window_title: String,
}

impl AyisState {
    pub fn new() -> Self {
        Self {
            config: Mutex::new(AyisConfig::default()),
            window_title: "AYIS".to_string(),
        }
    }
}

#[tauri::command]
fn get_config(state: State<AyisState>) -> AyisConfig {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
fn update_config(state: State<AyisState>, api_base: String) -> Result<AyisConfig, String> {
    let mut config = state.config.lock().unwrap();
    config.api_base = api_base;
    Ok(config.clone())
}

#[tauri::command]
fn get_version(state: State<AyisState>) -> String {
    state.config.lock().unwrap().app_version.clone()
}

#[tauri::command]
fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn maximize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_maximized = window.is_maximized().map_err(|e| e.to_string())?;
        if is_maximized {
            window.unmaximize().map_err(|e| e.to_string())?;
        } else {
            window.maximize().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn close_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_devtools(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(AyisState::new())
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = _app.get_webview_window("main") {
                    let _ = window.open_devtools();
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            update_config,
            get_version,
            minimize_window,
            maximize_window,
            close_window,
            toggle_devtools,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
