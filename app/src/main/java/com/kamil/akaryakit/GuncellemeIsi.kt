package com.kamil.akaryakit

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Uygulama kapalıyken bile çalışan güncelleme denetimi.
 * Sunucu gerekmez: GitHub'daki update.json okunur, yeni sürüm varsa
 * telefona bildirim düşer.
 */
class GuncellemeIsi(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

    override fun doWork(): Result {
        val ayar = applicationContext.getSharedPreferences(AYAR, Context.MODE_PRIVATE)
        if (!ayar.getBoolean(ANAHTAR_ACIK, true)) return Result.success()

        return try {
            val metin = indir(ADRES) ?: return Result.retry()
            val o = JSONObject(metin)
            val kod = o.optInt("versionCode", 0)
            val ad = o.optString("versionName", "")
            val not = o.optString("notes", "")

            val suKod = try {
                applicationContext.packageManager
                    .getPackageInfo(applicationContext.packageName, 0).longVersionCode.toInt()
            } catch (e: Exception) { 0 }

            val bildirilen = ayar.getInt(ANAHTAR_SON, 0)
            if (kod > suKod && kod > bildirilen) {
                bildirimGonder(applicationContext, ad, not)
                ayar.edit().putInt(ANAHTAR_SON, kod).apply()
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private fun indir(adres: String): String? {
        var baglanti: HttpURLConnection? = null
        return try {
            baglanti = (URL(adres).openConnection() as HttpURLConnection).apply {
                connectTimeout = 15000
                readTimeout = 15000
                setRequestProperty("Cache-Control", "no-cache")
            }
            if (baglanti.responseCode != 200) null
            else baglanti.inputStream.bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            null
        } finally {
            baglanti?.disconnect()
        }
    }

    companion object {
        const val AYAR = "akaryakit_ayar"
        const val ANAHTAR_ACIK = "guncelleme_bildirimi"
        private const val ANAHTAR_SON = "bildirilen_surum"
        private const val KANAL = "guncelleme"
        private const val IS_ADI = "akaryakit_guncelleme_denetimi"
        private const val ADRES =
            "https://raw.githubusercontent.com/kamilrdnn/akaryakit-patronu/main/update.json"

        /** Uygulama her açıldığında çağrılır; iş zaten varsa korunur. */
        fun planla(ctx: Context) {
            val kosul = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val is0 = PeriodicWorkRequestBuilder<GuncellemeIsi>(6, TimeUnit.HOURS)
                .setConstraints(kosul)
                .setInitialDelay(30, TimeUnit.MINUTES)
                .build()
            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(
                IS_ADI, ExistingPeriodicWorkPolicy.KEEP, is0
            )
        }

        fun durdur(ctx: Context) {
            WorkManager.getInstance(ctx).cancelUniqueWork(IS_ADI)
        }

        fun kanalKur(ctx: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val yonetici = ctx.getSystemService(NotificationManager::class.java) ?: return
            if (yonetici.getNotificationChannel(KANAL) != null) return
            val kanal = NotificationChannel(
                KANAL, "Güncellemeler", NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Yeni sürüm çıktığında haber verir"
                enableVibration(true)
            }
            yonetici.createNotificationChannel(kanal)
        }

        fun bildirimGonder(ctx: Context, surum: String, not: String) {
            kanalKur(ctx)
            val niyet = Intent(ctx, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("guncelleme", true)
            }
            val bayrak = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            val dokun = PendingIntent.getActivity(ctx, 1001, niyet, bayrak)

            val metin = if (not.isBlank()) not else "Yeni özellikler ve düzeltmeler hazır."
            val bildirim = NotificationCompat.Builder(ctx, KANAL)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("⛽ Akaryakıt Patronu v$surum hazır")
                .setContentText(metin)
                .setStyle(NotificationCompat.BigTextStyle().bigText("$metin\n\nGüncellemek için dokun."))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(dokun)
                .build()

            try {
                NotificationManagerCompat.from(ctx).notify(2001, bildirim)
            } catch (e: SecurityException) {
                /* bildirim izni yok: sessizce geç */
            }
        }
    }
}
