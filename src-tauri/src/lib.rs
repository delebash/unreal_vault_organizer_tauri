//  use tauri::Manager; needed with calling open_devtools

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_cors_fetch::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        //    .invoke_handler(tauri::generate_handler![http_request])
        .setup(|app| {
            if cfg!(debug_assertions) {
                //                   let window = app.get_webview_window("main").unwrap();
                //                     window.open_devtools();
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
// #[tauri::command]
// fn http_request(options: String) {
//     let data = std::fs::read("/path/to/file").unwrap();
//     tauri::ipc::Response::new(data)
// //    println!("I was invoked from JavaScript, with this message: {}", options);
// }
