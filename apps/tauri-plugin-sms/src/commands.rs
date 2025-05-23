use tauri::{command, AppHandle, Runtime};

use crate::{GetStatePayload, GetStateResult};
use crate::{InvokeActionPayload, InvokeActionResult};
use crate::{PermissionStatus, Result};
use crate::{PermissionType, SmsExt};
use crate::{SendSmsPayload, SendSmsStatus};

#[command]
pub(crate) async fn check_permissions<R: Runtime>(app: AppHandle<R>) -> Result<PermissionStatus> {
    app.sms().check_permissions()
}

#[command]
pub(crate) async fn request_permissions<R: Runtime>(
    app: AppHandle<R>,
    permissions: Option<Vec<PermissionType>>,
) -> Result<PermissionStatus> {
    app.sms().request_permissions(permissions)
}

#[command]
pub(crate) async fn send_sms<R: Runtime>(
    app: AppHandle<R>,
    payload: Option<SendSmsPayload>,
) -> Result<SendSmsStatus> {
    app.sms().send_sms(payload)
}

#[command]
pub(crate) async fn get_state<R: Runtime>(
    app: AppHandle<R>,
    payload: Option<GetStatePayload>,
) -> Result<GetStateResult> {
    app.sms().get_state(payload)
}


#[command]
pub(crate) async fn invoke_action<R: Runtime>(
    app: AppHandle<R>,
    payload: Option<InvokeActionPayload>,
) -> Result<InvokeActionResult> {
    app.sms().invoke_action(payload)
}
