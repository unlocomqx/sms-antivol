use serde::{Deserialize, Serialize};
use tauri::plugin::PermissionState;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PermissionType {
    Sms,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatus {
    /// Permission state for the location alias.
    ///
    /// On Android it requests/checks both ACCESS_COARSE_LOCATION and ACCESS_FINE_LOCATION permissions.
    ///
    /// On iOS it requests/checks location permissions.
    pub sms: PermissionState,
}

#[derive(Serialize)]
pub struct SendSmsPayload {
    to: Option<String>,
    body: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SendSmsStatus {
    pub success: bool,
}

#[derive(Serialize)]
pub struct GetStatePayload {
    state: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetStateResult {
    pub state: bool,
    pub data: String,
}


#[derive(Serialize)]
pub struct InvokeActionPayload {
    action: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct InvokeActionResult {
    pub result: bool,
    pub data: String,
}
