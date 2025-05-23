use crate::PermissionStatus;
use crate::PermissionType;
use crate::{GetStatePayload, GetStateResult};
use crate::{InvokeActionPayload, InvokeActionResult};
use crate::{SendSmsPayload, SendSmsStatus};
use serde::{de::DeserializeOwned, Serialize};
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_sms);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<Sms<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.plugin.smstracker", "SmsPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_sms)?;
    Ok(Sms(handle))
}

/// Access to the sms APIs.
pub struct Sms<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Sms<R> {
    pub fn check_permissions(&self) -> crate::Result<PermissionStatus> {
        self.0
            .run_mobile_plugin("checkPermissions", ())
            .map_err(Into::into)
    }

    pub fn request_permissions(
        &self,
        permissions: Option<Vec<PermissionType>>,
    ) -> crate::Result<PermissionStatus> {
        self.0
            .run_mobile_plugin(
                "requestPermissions",
                serde_json::json!({ "permissions": permissions }),
            )
            .map_err(Into::into)
    }

    pub fn send_sms(&self, payload: Option<SendSmsPayload>) -> crate::Result<SendSmsStatus> {
        self.0
            .run_mobile_plugin("sendSms", payload)
            .map_err(Into::into)
    }

    pub fn get_state(&self, payload: Option<GetStatePayload>) -> crate::Result<GetStateResult> {
        self.0
            .run_mobile_plugin("getState", payload)
            .map_err(Into::into)
    }

    pub fn invoke_action(&self, payload: Option<InvokeActionPayload>) -> crate::Result<InvokeActionResult> {
        self.0
            .run_mobile_plugin("invokeAction", payload)
            .map_err(Into::into)
    }
}
