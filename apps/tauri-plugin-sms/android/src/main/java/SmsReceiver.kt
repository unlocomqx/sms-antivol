import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsMessage
import android.util.Log
import app.tauri.plugin.JSObject

class SMSReceiver : BroadcastReceiver() {

    private var onSmsReceived: (data: JSObject) -> Unit = {}

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null) return

        val bundle = intent.extras
        if (bundle != null) {
            val sms = bundle.get(SMS_BUNDLE) as Array<Any>?
            val smsMsg = StringBuilder()

            var smsMessage: SmsMessage
            if (sms != null) {
                for (sm in sms) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val format = bundle.getString("format")
                        smsMessage = SmsMessage.createFromPdu(sm as ByteArray, format)
                    } else {
                        smsMessage = SmsMessage.createFromPdu(sm as ByteArray)
                    }


                    val msgBody = smsMessage.messageBody.toString()
                    val msgAddress = smsMessage.originatingAddress

                    smsMsg.append(msgBody)

                    val msgData = JSObject()
                    msgData.put("body", smsMsg)
                    msgData.put("from", msgAddress)
                    Log.d("SMSReceiver", "SMS received: $msgData")
                    sendBroadcast(msgData)
                }
            }
        }
    }

    fun setOnSmsReceivedListener(listener: (data: JSObject) -> Unit) {
        onSmsReceived = listener
    }

    private fun sendBroadcast(msgData: JSObject) {
        onSmsReceived(msgData)
    }

    companion object {
        const val SMS_BUNDLE = "pdus"
    }
}