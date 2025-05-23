const COMMANDS: &[&str] = &["check_permissions", "request_permissions", "register_listener", "registerListener", "remove_listener", "removeListener", "send_sms", "get_state", "invoke_action"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
