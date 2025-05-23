use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Sms;
#[cfg(mobile)]
use mobile::Sms;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the sms APIs.
pub trait SmsExt<R: Runtime> {
    fn sms(&self) -> &Sms<R>;
}

impl<R: Runtime, T: Manager<R>> crate::SmsExt<R> for T {
    fn sms(&self) -> &Sms<R> {
        self.state::<Sms<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("sms")
        .invoke_handler(tauri::generate_handler![
            commands::check_permissions,
            commands::request_permissions
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let sms = mobile::init(app, api)?;
            #[cfg(desktop)]
            let sms = desktop::init(app, api)?;
            app.manage(sms);
            Ok(())
        })
        .build()
}
