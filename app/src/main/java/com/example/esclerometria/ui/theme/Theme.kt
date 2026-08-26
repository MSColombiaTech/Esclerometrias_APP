package com.example.esclerometria.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = BrandSkyLight,
    onPrimary = Slate950,
    primaryContainer = BrandSkyDark,
    onPrimaryContainer = Slate50,
    secondary = AmberGold,
    onSecondary = Slate950,
    secondaryContainer = AmberGoldDark,
    onSecondaryContainer = AmberGoldLight,
    tertiary = EmeraldSuccess,
    onTertiary = Slate950,
    background = Slate950,
    onBackground = Slate100,
    surface = Slate900,
    onSurface = Slate100,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate300,
    outline = Slate700,
    error = RoseAlert,
    onError = Slate950
)

private val LightColorScheme = lightColorScheme(
    primary = BrandSky,
    onPrimary = Slate50,
    primaryContainer = BrandSkyLight.copy(alpha = 0.2f),
    onPrimaryContainer = BrandSkyDark,
    secondary = AmberGoldDark,
    onSecondary = Slate50,
    background = Slate50,
    onBackground = Slate900,
    surface = Slate100,
    onSurface = Slate900,
    surfaceVariant = Slate200,
    onSurfaceVariant = Slate700,
    outline = Slate300,
    error = RoseAlert,
    onError = Slate50
)

@Composable
fun EsclerometriaProTheme(
    darkTheme: Boolean = true, // Default to sleek technical dark theme
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
