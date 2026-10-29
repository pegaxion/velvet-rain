Add-Type -AssemblyName System.Drawing

$assetsDir = "C:\Users\ankuj\Downloads\Antigravity\Pegasus CRM\velvet-rain\store-assets"
if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir | Out-Null }

$iconPath = "C:\Users\ankuj\Downloads\Antigravity\Pegasus CRM\velvet-rain\icon-512.png"
$iconImg = [System.Drawing.Image]::FromFile($iconPath)

$fontFamily = New-Object System.Drawing.FontFamily("Segoe UI")
$centerFormat = New-Object System.Drawing.StringFormat
$centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
$centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

# ==============================================================================
# 1. FEATURE GRAPHIC (1024 x 500)
# ==============================================================================
$fgW = 1024
$fgH = 500
$fg = New-Object System.Drawing.Bitmap($fgW, $fgH)
$g = [System.Drawing.Graphics]::FromImage($fg)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Deep ambient luxury gradient
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($fgW, $fgH)),
    [System.Drawing.Color]::FromArgb(255, 18, 22, 45),
    [System.Drawing.Color]::FromArgb(255, 3, 5, 10)
)
$g.FillRectangle($bgBrush, 0, 0, $fgW, $fgH)
$bgBrush.Dispose()

# Ambient glow on right
$glow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 99, 102, 241))
$g.FillEllipse($glow, 650, 40, 450, 450)
$glow.Dispose()

# Draw App Icon on Right (240x240)
$iconSize = 250
$iconX = 700
$iconY = 125
$g.DrawImage($iconImg, $iconX, $iconY, $iconSize, $iconSize)

# Draw Left Typography
$badgeFont = New-Object System.Drawing.Font($fontFamily, 12, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleFont = New-Object System.Drawing.Font($fontFamily, 56, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$taglineFont = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bulletFont = New-Object System.Drawing.Font($fontFamily, 15, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font($fontFamily, 12, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

# Badge
$badgeBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 99, 102, 241))
$badgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 99, 102, 241), 1)
$g.FillRectangle($badgeBg, 60, 85, 230, 32)
$g.DrawRectangle($badgePen, 60, 85, 230, 32)
$badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 129, 140, 248))
$g.DrawString("AMBIENT SLEEP SANCTUARY", $badgeFont, $badgeBrush, 74, 93)

# App Title
$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.DrawString("VelvetRain", $titleFont, $titleBrush, 56, 135)

# Tagline
$taglineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$g.DrawString("Sleep, Ambient Rain and Focus Mixer", $taglineFont, $taglineBrush, 60, 215)

# Value Proposition Pills
$pillBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 30, 41, 59))
$pillBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), 1)
$pillText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))

$pills = @("100% Gapless Audio", "Zero Ads", "Smart Sleep Fade-Out", "True OLED Black")
$px = 60
$py = 275
foreach ($pill in $pills) {
    $size = $g.MeasureString($pill, $bulletFont)
    $pw = [int]$size.Width + 24
    $g.FillRectangle($pillBg, $px, $py, $pw, 36)
    $g.DrawRectangle($pillBorder, $px, $py, $pw, 36)
    $g.DrawString($pill, $bulletFont, $pillText, $px + 12, $py + 9)
    $px += $pw + 12
    if ($px > 600) { $px = 60; $py += 46 }
}

# Pegaxion Watermark
$pegaxionBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 100, 116, 139))
$g.DrawString("PEGAXION STUDIOS", $subFont, $pegaxionBrush, 60, 420)

$featureGraphicPath = Join-Path $assetsDir "velvetrain_feature_graphic_1024x500.png"
$fg.Save($featureGraphicPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$fg.Dispose()
Write-Host "Created Feature Graphic: $featureGraphicPath"


# ==============================================================================
# 2. SCREENSHOT GENERATOR (1080 x 1920 Phone Aspect Ratio)
# ==============================================================================
function Make-Screenshot($filename, $topTag, $mainHeading, $subHeading, [scriptblock]$drawMockupScript) {
    $w = 1080
    $h = 1920
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $gs = [System.Drawing.Graphics]::FromImage($bmp)
    $gs.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gs.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gs.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background
    $bgB = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($w, $h)),
        [System.Drawing.Color]::FromArgb(255, 12, 16, 32),
        [System.Drawing.Color]::FromArgb(255, 2, 4, 8)
    )
    $gs.FillRectangle($bgB, 0, 0, $w, $h)
    $bgB.Dispose()

    # Ambient Top Glow
    $glowB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 99, 102, 241))
    $gs.FillEllipse($glowB, 190, 80, 700, 500)
    $glowB.Dispose()

    # Top Tag
    $tagF = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $tagB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
    $gs.DrawString($topTag.ToUpper(), $tagF, $tagB, 540, 140, $centerFormat)

    # Main Heading
    $headF = New-Object System.Drawing.Font($fontFamily, 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $headB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $gs.DrawString($mainHeading, $headF, $headB, 540, 210, $centerFormat)

    # Sub Heading
    $subF = New-Object System.Drawing.Font($fontFamily, 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $subB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $gs.DrawString($subHeading, $subF, $subB, 540, 280, $centerFormat)

    # Phone Frame Container
    $frameX = 90
    $frameY = 360
    $frameW = 900
    $frameH = 1500

    # Phone Outer Shell
    $phoneShell = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 22, 34))
    $phoneBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 99, 102, 241), 3)
    $gs.FillRectangle($phoneShell, $frameX, $frameY, $frameW, $frameH)
    $gs.DrawRectangle($phoneBorder, $frameX, $frameY, $frameW, $frameH)

    # Execute custom inner UI mockup
    & $drawMockupScript $gs $frameX $frameY $frameW $frameH

    $outPath = Join-Path $assetsDir $filename
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gs.Dispose()
    $bmp.Dispose()
    Write-Host "Created Screenshot: $outPath"
}

# SCREENSHOT 1: Multi-Track Soundboard
Make-Screenshot "velvetrain_screenshot_1_mixer.png" "Procedural Audio Synthesis" "Multi-Track Sound Mixer" "Blend 9 Nature Layers with Zero Audio Loop Clicks" {
    param($g, $fx, $fy, $fw, $fh)
    
    # App Header inside mockup
    $hF = New-Object System.Drawing.Font($fontFamily, 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $wB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString("VelvetRain", $hF, $wB, $fx + 40, $fy + 40)
    
    # Presets Row
    $presetB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
    $g.FillRectangle($presetB, $fx + 40, $fy + 110, 240, 60)
    $pF = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("Midnight Storm", $pF, $wB, $fx + 55, $fy + 125)

    $presetInactive = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 255, 255, 255))
    $g.FillRectangle($presetInactive, $fx + 300, $fy + 110, 200, 60)
    $g.DrawString("Cozy Hearth", $pF, $wB, $fx + 320, $fy + 125)

    $g.FillRectangle($presetInactive, $fx + 520, $fy + 110, 220, 60)
    $g.DrawString("Moonlit Shore", $pF, $wB, $fx + 540, $fy + 125)

    # Sound Cards
    $cards = @(
        @{ name = "Heavy Rain"; desc = "Continuous downpour on glass"; vol = "80%"; active = $true },
        @{ name = "Distant Thunder"; desc = "Low-frequency rolling rumbles"; vol = "45%"; active = $true },
        @{ name = "Cozy Campfire"; desc = "Warm wood embers and crackles"; vol = "60%"; active = $true },
        @{ name = "Deep Brown Noise"; desc = "ADHD focus and slow-wave sleep"; vol = "50%"; active = $true },
        @{ name = "Night Crickets"; desc = "Twilight evening chirps"; vol = "25%"; active = $false },
        @{ name = "Bedroom Fan"; desc = "Acoustic masking airflow"; vol = "40%"; active = $false }
    )

    $cy = $fy + 200
    foreach ($card in $cards) {
        $cardB = if ($card.active) {
            New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 28, 38, 68))
        } else {
            New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 18, 28))
        }
        $cardP = if ($card.active) {
            New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 99, 102, 241), 2)
        } else {
            New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 255, 255, 255), 1)
        }

        $g.FillRectangle($cardB, $fx + 40, $cy, $fw - 80, 160)
        $g.DrawRectangle($cardP, $fx + 40, $cy, $fw - 80, 160)

        # Card Title & Description
        $cTitleF = New-Object System.Drawing.Font($fontFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $cDescF = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
        $mutedB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))

        $g.DrawString($card.name, $cTitleF, $wB, $fx + 65, $cy + 25)
        $g.DrawString($card.desc, $cDescF, $mutedB, $fx + 65, $cy + 65)

        # Volume Slider Mockup
        $trackB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 255, 255, 255))
        $g.FillRectangle($trackB, $fx + 65, $cy + 115, 600, 12)
        
        $volPercent = [int]($card.vol.Replace("%",""))
        $fillW = [int](600 * ($volPercent / 100))
        $fillB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
        $g.FillRectangle($fillB, $fx + 65, $cy + 115, $fillW, 12)

        $vF = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $g.DrawString($card.vol, $vF, $wB, $fx + 700, $cy + 107)

        $cy += 185
    }
}

# SCREENSHOT 2: Sleep Timer Fade-Out
Make-Screenshot "velvetrain_screenshot_2_timer.png" "Zero Wake-Ups" "Smart Sleep Dimmer" "Gently Fades Volume Over the Final 5 Minutes" {
    param($g, $fx, $fy, $fw, $fh)
    
    $sheetB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 18, 30))
    $sheetP = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 99, 102, 241), 2)
    $g.FillRectangle($sheetB, $fx + 40, $fy + 120, $fw - 80, 1200)
    $g.DrawRectangle($sheetP, $fx + 40, $fy + 120, $fw - 80, 1200)

    $tF = New-Object System.Drawing.Font($fontFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $wB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString("Sleep Timer", $tF, $wB, $fx + 80, $fy + 180)

    $dF = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $mutedB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $g.DrawString("Audio fades out smoothly so you drift naturally into deep sleep without sudden silence.", $dF, $mutedB, (New-Object System.Drawing.RectangleF($fx + 80, $fy + 250, $fw - 160, 120)))

    # Timer Buttons Grid (15, 30, 45, 1h, 90m, Continuous)
    $times = @("15 min", "30 min", "45 min", "1 Hour", "90 min", "Continuous")
    $bx = $fx + 80
    $by = $fy + 400
    $bw = 340
    $bh = 120
    $btnFont = New-Object System.Drawing.Font($fontFamily, 32, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

    for ($i = 0; $i -lt $times.Length; $i++) {
        $btnText = $times[$i]
        $isActive = ($i -eq 2) # 45 min active

        $btnBg = if ($isActive) {
            New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
        } else {
            New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 30, 48))
        }
        $g.FillRectangle($btnBg, $bx, $by, $bw, $bh)
        $g.DrawString($btnText, $btnFont, $wB, $bx + ($bw/2), $by + ($bh/2), $centerFormat)

        if (($i % 2) -eq 0) {
            $bx += $bw + 40
        } else {
            $bx = $fx + 80
            $by += $bh + 30
        }
    }

    # Live Countdown Callout
    $activeB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 99, 102, 241))
    $g.FillRectangle($activeB, $fx + 80, $fy + 900, $fw - 160, 200)
    $countFont = New-Object System.Drawing.Font($fontFamily, 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $cyanB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    $g.DrawString("38:14 Remaining", $countFont, $cyanB, 540, $fy + 970, $centerFormat)
    $subCountF = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("Automatic 5-Minute Exponential Dimmer Active", $subCountF, $wB, 540, $fy + 1040, $centerFormat)
}

# SCREENSHOT 3: 4-7-8 Breathing Pacer
Make-Screenshot "velvetrain_screenshot_3_breathing.png" "Parasympathetic Relaxation" "4-7-8 Breathing Pacer" "Clinically Proven Rhythm to Lower Heart Rate Before Bed" {
    param($g, $fx, $fy, $fw, $fh)
    
    $wB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $hF = New-Object System.Drawing.Font($fontFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("Sleep Breathwork", $hF, $wB, 540, $fy + 160, $centerFormat)

    $dF = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $mutedB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $g.DrawString("Inhale 4s through nose, hold 7s, exhale 8s through mouth.", $dF, $mutedB, 540, $fy + 230, $centerFormat)

    # Large Glowing Circle in Center
    $circleRadius = 260
    $cx = 540
    $cy = $fy + 700

    $outerGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 56, 189, 248))
    $g.FillEllipse($outerGlow, $cx - $circleRadius - 40, $cy - $circleRadius - 40, ($circleRadius + 40)*2, ($circleRadius + 40)*2)

    $circleFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 20, 28, 55))
    $circlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 6)
    $g.FillEllipse($circleFill, $cx - $circleRadius, $cy - $circleRadius, $circleRadius*2, $circleRadius*2)
    $g.DrawEllipse($circlePen, $cx - $circleRadius, $cy - $circleRadius, $circleRadius*2, $circleRadius*2)

    $phaseFont = New-Object System.Drawing.Font($fontFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $countFont = New-Object System.Drawing.Font($fontFamily, 110, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $cyanB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))

    $g.DrawString("Inhale Gently", $phaseFont, $wB, $cx, $cy - 60, $centerFormat)
    $g.DrawString("4", $countFont, $cyanB, $cx, $cy + 50, $centerFormat)

    # Instruction Steps
    $stepF = New-Object System.Drawing.Font($fontFamily, 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $stepB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
    $g.DrawString("4s Inhale  -  7s Hold  -  8s Exhale", $stepF, $stepB, 540, $fy + 1150, $centerFormat)
}

# SCREENSHOT 4: True OLED Pitch-Black Mode
Make-Screenshot "velvetrain_screenshot_4_oled.png" "Dark Bedroom Engineered" "True OLED Pitch-Black" "No Blinding White Screens at 2:00 AM - Saves Battery" {
    param($g, $fx, $fy, $fw, $fh)
    
    # Pure pitch-black inner screen
    $blackB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
    $g.FillRectangle($blackB, $fx + 10, $fy + 10, $fw - 20, $fh - 20)

    $wB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $tF = New-Object System.Drawing.Font($fontFamily, 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("VelvetRain OLED", $tF, $wB, 540, $fy + 160, $centerFormat)

    $dF = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $mutedB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 100, 116, 139))
    $g.DrawString("AMOLED Pixels Fully Powered Off (#000000)", $dF, $mutedB, 540, $fy + 220, $centerFormat)

    # Active Ambient Equalizer Mockup
    $eqY = $fy + 550
    $bars = @(60, 110, 160, 90, 140, 200, 130, 80, 170, 120, 190, 70)
    $eqX = $fx + 120
    $eqBarW = 38
    $eqSpacing = 22
    $eqB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 99, 102, 241))

    foreach ($bH in $bars) {
        $g.FillRectangle($eqB, $eqX, $eqY - ($bH/2), $eqBarW, $bH)
        $eqX += $eqBarW + $eqSpacing
    }

    # Playing status
    $playStatusF = New-Object System.Drawing.Font($fontFamily, 36, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("Playing: Heavy Rain + Distant Thunder", $playStatusF, $wB, 540, $fy + 800, $centerFormat)
    $g.DrawString("100% Offline - Zero Trackers - Airplane Mode Ready", $dF, $mutedB, 540, $fy + 860, $centerFormat)
}

$iconImg.Dispose()
Write-Host "ALL_ASSETS_SUCCESS"
