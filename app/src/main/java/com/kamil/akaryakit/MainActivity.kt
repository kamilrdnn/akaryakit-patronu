package com.kamil.akaryakit

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File

/**
 * Oyun kabuğu. Oyunun tamamı assets/ içindeki web motorunda çalışır; WebViewAssetLoader
 * sayesinde sabit bir origin (https://appassets.androidplatform.net) üzerinden yüklenir,
 * böylece localStorage kayıtları güncellemelerde silinmez.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var indirmeId: Long = -1L
    private var alici: BroadcastReceiver? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        tamEkran()

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this)
        web.setBackgroundColor(0xFF0E1420.toInt())
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_NO_CACHE
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            textZoom = 100
        }
        WebView.setWebContentsDebuggingEnabled(false)

        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)
        }

        web.addJavascriptInterface(Kabuk(), "AndroidKabuk")
        setContentView(web)

        web.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        /* bildirimden açıldıysa doğrudan güncelleme ekranını göster */
        if (intent?.getBooleanExtra("guncelleme", false) == true) {
            web.postDelayed({
                web.evaluateJavascript("window.GUNCELLE && GUNCELLE.kontrol(true)", null)
            }, 2500)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.oyunGeriTusu && window.oyunGeriTusu()") { sonuc ->
                    if (sonuc == "false") finish()
                }
            }
        })

        indirmeAlicisiKur()
        bildirimKur()
    }

    /** Bildirim izni (Android 13+) ve arka plan güncelleme denetimi. */
    private fun bildirimKur() {
        GuncellemeIsi.kanalKur(this)
        val ayar = getSharedPreferences(GuncellemeIsi.AYAR, MODE_PRIVATE)
        if (ayar.getBoolean(GuncellemeIsi.ANAHTAR_ACIK, true)) {
            if (Build.VERSION.SDK_INT >= 33) {
                val izin = ContextCompat.checkSelfPermission(
                    this, android.Manifest.permission.POST_NOTIFICATIONS
                )
                if (izin != PackageManager.PERMISSION_GRANTED && !ayar.getBoolean("izin_soruldu", false)) {
                    ayar.edit().putBoolean("izin_soruldu", true).apply()
                    izinIstegi.launch(android.Manifest.permission.POST_NOTIFICATIONS)
                }
            }
            GuncellemeIsi.planla(this)
        }
    }

    private fun bildirimAyarlariniAc() {
        try {
            val niyet = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
            }
            startActivity(niyet.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) { }
    }

    private val izinIstegi = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { verildi ->
        if (verildi) GuncellemeIsi.planla(this)
    }

    private fun tamEkran() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            )
    }

    override fun onResume() {
        super.onResume()
        tamEkran()
        web.evaluateJavascript("window.oyunDevam && window.oyunDevam()", null)
    }

    override fun onPause() {
        super.onPause()
        web.evaluateJavascript("window.oyunDurdur && window.oyunDurdur()", null)
    }

    override fun onDestroy() {
        super.onDestroy()
        alici?.let { try { unregisterReceiver(it) } catch (_: Exception) {} }
    }

    /* ---------------- uygulama içi güncelleme ---------------- */

    private fun indirmeAlicisiKur() {
        alici = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, i: Intent?) {
                val gelen = i?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) ?: -1L
                if (gelen != indirmeId || gelen == -1L) return
                kurulumuBaslat()
            }
        }
        val filtre = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(alici, filtre, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(alici, filtre)
        }
    }

    private fun apkDosyasi(): File {
        val klasor = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
            ?: File(filesDir, "indirilenler").apply { mkdirs() }
        return File(klasor, "akaryakit-guncelleme.apk")
    }

    private fun kurulumuBaslat() {
        val dosya = apkDosyasi()
        if (!dosya.exists() || dosya.length() < 10_000) {
            Toast.makeText(this, "Güncelleme dosyası indirilemedi", Toast.LENGTH_LONG).show()
            return
        }
        try {
            val uri: Uri = FileProvider.getUriForFile(this, "$packageName.dosya", dosya)
            val niyet = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(niyet)
        } catch (e: Exception) {
            Toast.makeText(this, "Kurulum başlatılamadı: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    inner class Kabuk {
        @JavascriptInterface
        fun titret(ms: Int) {
            try {
                val v: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vm = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vm.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    getSystemService(VIBRATOR_SERVICE) as Vibrator
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(ms.toLong(), 60))
                } else {
                    @Suppress("DEPRECATION")
                    v.vibrate(ms.toLong())
                }
            } catch (_: Exception) {
            }
        }

        @JavascriptInterface
        fun cik() { runOnUiThread { finish() } }

        /** Oyun içindeki anahtar: güncelleme bildirimlerini aç/kapat. */
        @JavascriptInterface
        fun bildirimAyar(acik: Boolean) {
            getSharedPreferences(GuncellemeIsi.AYAR, MODE_PRIVATE)
                .edit().putBoolean(GuncellemeIsi.ANAHTAR_ACIK, acik).apply()
            runOnUiThread {
                if (acik) {
                    if (Build.VERSION.SDK_INT >= 33) {
                        val izin = ContextCompat.checkSelfPermission(
                            this@MainActivity, android.Manifest.permission.POST_NOTIFICATIONS
                        )
                        if (izin != PackageManager.PERMISSION_GRANTED) {
                            izinIstegi.launch(android.Manifest.permission.POST_NOTIFICATIONS)
                            return@runOnUiThread
                        }
                    }
                    GuncellemeIsi.planla(this@MainActivity)
                } else {
                    GuncellemeIsi.durdur(this@MainActivity)
                }
            }
        }

        /** "acik" | "izinYok" | "kapali" */
        @JavascriptInterface
        fun bildirimDurum(): String {
            val acik = getSharedPreferences(GuncellemeIsi.AYAR, MODE_PRIVATE)
                .getBoolean(GuncellemeIsi.ANAHTAR_ACIK, true)
            if (!acik) return "kapali"
            return if (NotificationManagerCompat.from(this@MainActivity).areNotificationsEnabled()) "acik" else "izinYok"
        }

        /** Deneme bildirimi yollar; izin yoksa önce izni ister. true: gönderildi. */
        @JavascriptInterface
        fun bildirimDene(): Boolean {
            if (NotificationManagerCompat.from(this@MainActivity).areNotificationsEnabled()) {
                GuncellemeIsi.denemeGonder(this@MainActivity)
                GuncellemeIsi.planla(this@MainActivity)
                return true
            }
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= 33 &&
                    shouldShowRequestPermissionRationale(android.Manifest.permission.POST_NOTIFICATIONS)
                ) {
                    izinIstegi.launch(android.Manifest.permission.POST_NOTIFICATIONS)
                } else {
                    bildirimAyarlariniAc()
                }
            }
            return false
        }

        /** Telefonun bu uygulamaya ait bildirim ayarları. */
        @JavascriptInterface
        fun bildirimAyarAc() { runOnUiThread { bildirimAyarlariniAc() } }

        /** Uygulama bilgisi ekranı: otomatik başlatma ve pil kısıtlaması buradan ayarlanır. */
        @JavascriptInterface
        fun uygulamaAyarAc() {
            runOnUiThread {
                try {
                    startActivity(
                        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                } catch (_: Exception) { }
            }
        }

        @JavascriptInterface
        fun bildirimAcikMi(): Boolean =
            getSharedPreferences(GuncellemeIsi.AYAR, MODE_PRIVATE)
                .getBoolean(GuncellemeIsi.ANAHTAR_ACIK, true)

        @JavascriptInterface
        fun surum(): String = try {
            packageManager.getPackageInfo(packageName, 0).versionName ?: "1.0"
        } catch (_: Exception) { "1.0" }

        @JavascriptInterface
        fun surumKodu(): String = try {
            val bilgi = packageManager.getPackageInfo(packageName, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) bilgi.longVersionCode.toString()
            else @Suppress("DEPRECATION") bilgi.versionCode.toString()
        } catch (_: Exception) { "0" }

        /** update.json içindeki apkUrl'yi indirir, bitince kurulum ekranını açar. */
        @JavascriptInterface
        fun guncelle(url: String) {
            runOnUiThread {
                try {
                    val dosya = apkDosyasi()
                    if (dosya.exists()) dosya.delete()
                    val istek = DownloadManager.Request(Uri.parse(url))
                        .setTitle("Akaryakıt Patronu güncellemesi")
                        .setDescription("Yeni sürüm indiriliyor…")
                        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        .setDestinationUri(Uri.fromFile(dosya))
                        .setAllowedOverMetered(true)
                        .setAllowedOverRoaming(true)
                    val yonetici = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                    indirmeId = yonetici.enqueue(istek)
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "İndirme başlatılamadı: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
