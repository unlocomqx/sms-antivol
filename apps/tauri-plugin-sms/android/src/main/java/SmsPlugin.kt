package com.plugin.smstracker

import SMSReceiver
import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.BatteryManager
import android.os.PowerManager
import android.provider.Settings
import android.provider.Telephony
import android.telephony.SmsManager
import android.util.Log
import android.webkit.WebView
import androidx.activity.result.ActivityResult
import androidx.core.net.toUri
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin


@InvokeArg
class SendSmsArgs {
    var to: String? = null
    var body: String? = null
}

@InvokeArg
class GetStateArgs {
    var state: String? = null
}

@InvokeArg
class InvokeActionArgs {
    var action: String? = null
}

private const val ALIAS_SMS: String = "sms"

@Suppress("unused")
@TauriPlugin(
    permissions = [
        Permission(
            strings = [
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.SEND_SMS,
                Manifest.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
            ],
            alias = ALIAS_SMS
        )
    ]
)
class SmsPlugin(private val activity: Activity) : Plugin(activity) {
    private lateinit var smsBroadcastReceiver: SMSReceiver


    override fun load(webView: WebView) {
        super.load(webView)

        smsBroadcastReceiver = SMSReceiver()
        smsBroadcastReceiver.setOnSmsReceivedListener { data ->
            trigger("sms-received", data)
        }
        activity.registerReceiver(
            smsBroadcastReceiver,
            IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
        )
    }

    override fun onResume() {
        super.onResume()
        trigger("resume", JSObject())
    }

    @Command
    override fun checkPermissions(invoke: Invoke) {
        super.checkPermissions(invoke)
    }

    @Command
    override fun requestPermissions(invoke: Invoke) {
        super.requestPermissions(invoke)
    }

    @Suppress("unused")
    @PermissionCallback
    private fun smsPermissionCallback(invoke: Invoke) {
        val permissionsResultJSON = JSObject()
        permissionsResultJSON.put("sms", getPermissionState(ALIAS_SMS))
        invoke.resolve(permissionsResultJSON)
    }

    @Suppress("unused")
    @Command
    fun sendSms(invoke: Invoke) {
        val sendSmsResultJSON = JSObject()
        val smsManager: SmsManager? = activity.getSystemService(SmsManager::class.java)

        if (smsManager == null) {
            sendSmsResultJSON.put("success", false)
            invoke.resolve(sendSmsResultJSON)
            return
        }

        val args = invoke.parseArgs(SendSmsArgs::class.java)

        if (args.to == null || args.body == null) {
            sendSmsResultJSON.put("success", false)
            invoke.resolve(sendSmsResultJSON)
            return
        }

        smsManager.sendTextMessage(
            args.to,
            "SmsTracker",
            args.body,
            null,
            null
        )

        sendSmsResultJSON.put("success", true)
        Log.d("SmsPlugin", "Sms sent")
        invoke.resolve(sendSmsResultJSON)
    }

    @Suppress("unused")
    @Command
    fun getState(invoke: Invoke) {
        val args = invoke.parseArgs(GetStateArgs::class.java)

        val stateResultJSON = JSObject()
        val dataJSON = JSObject()
        stateResultJSON.put("state", false)
        stateResultJSON.put("data", "{}")
        when (args.state) {
            "silent_mode" -> {
                val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager?
                stateResultJSON.put(
                    "state",
                    audioManager?.ringerMode == AudioManager.RINGER_MODE_SILENT
                )
                stateResultJSON.put("data", "{}")
            }

            "charging" -> {
                val batteryBroadcast: Intent? = activity.registerReceiver(
                    null,
                    IntentFilter(Intent.ACTION_BATTERY_CHANGED)
                )
                val isCharging =
                    batteryBroadcast?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) != 0
                stateResultJSON.put("state", isCharging)
            }

            "battery_unrestricted" -> {
                val powerManager = activity.getSystemService(Context.POWER_SERVICE) as PowerManager?
                stateResultJSON.put(
                    "state",
                    powerManager?.isIgnoringBatteryOptimizations(activity.packageName)
                )
            }

            else -> {
                stateResultJSON.put("state", false)
                dataJSON.put("error", "Invalid state")
                stateResultJSON.put("data", dataJSON)
            }
        }
        invoke.resolve(stateResultJSON)
    }

    @Suppress("unused")
    @Command
    fun invokeAction(invoke: Invoke) {
        val args = invoke.parseArgs(InvokeActionArgs::class.java)

        val stateResultJSON = JSObject()
        val dataJSON = JSObject()
        stateResultJSON.put("result", true)
        stateResultJSON.put("data", "{}")
        when (args.action) {
            "ask_ignore_optimizations" -> {
                val intent: Intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                intent.setData(("package:" + activity.packageName).toUri())
                Log.d("SmsPlugin", "Ask ignore optimizations")
                startActivityForResult(invoke, intent, "askIgnoreOptimizationsCallback")
                Log.d("SmsPlugin", "Ask ignore optimizations launched")
            }

            else -> {
                stateResultJSON.put("result", false)
                dataJSON.put("error", "Invalid action")
                stateResultJSON.put("data", dataJSON)
                invoke.resolve(stateResultJSON)
            }
        }
    }

    @ActivityCallback
    private fun askIgnoreOptimizationsCallback(invoke: Invoke, result: ActivityResult) {
        Log.d("SmsPlugin", "Open settings result")
        val stateResultJSON = JSObject()
        stateResultJSON.put("result", true)
        stateResultJSON.put("data", "{}")
        invoke.resolve(stateResultJSON)
    }
}
