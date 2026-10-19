package com.unimove.unimove_customer

import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Bundle
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.android.RenderMode

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.setFormat(PixelFormat.OPAQUE)
        window.statusBarColor = Color.parseColor("#004AC6")
        window.navigationBarColor = Color.WHITE
        super.onCreate(savedInstanceState)
    }

    override fun getRenderMode(): RenderMode = RenderMode.texture
}
