import 'dart:math' as math;
import 'package:flutter/material.dart';

class Liver3DCanvas extends StatefulWidget {
  final String sliceMode; // 'axial', 'coronal', 'sagittal'
  final bool showVessels;
  final bool showPlane;

  const Liver3DCanvas({
    super.key,
    this.sliceMode = 'axial',
    this.showVessels = true,
    this.showPlane = true,
  });

  @override
  State<Liver3DCanvas> createState() => _Liver3DCanvasState();
}

class _Liver3DCanvasState extends State<Liver3DCanvas> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size.infinite,
          painter: Liver3DPainter(
            progress: _controller.value,
            sliceMode: widget.sliceMode,
            showVessels: widget.showVessels,
            showPlane: widget.showPlane,
          ),
        );
      },
    );
  }
}

class Liver3DPainter extends CustomPainter {
  final double progress;
  final String sliceMode;
  final bool showVessels;
  final bool showPlane;

  Liver3DPainter({
    required this.progress,
    required this.sliceMode,
    required this.showVessels,
    required this.showPlane,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) * 0.38;

    // Background radial glow
    final bgGlow = Paint()
      ..shader = RadialGradient(
        colors: [const Color(0xFF1E293B), const Color(0xFF0F172A).withOpacity(0.2)],
      ).createShader(Rect.fromCircle(center: center, radius: radius * 1.5));
    canvas.drawCircle(center, radius * 1.5, bgGlow);

    final angle = progress * 2 * math.pi;

    // 1. Organic Right Lobe
    final rightLobeCenter = center + Offset(math.cos(angle * 0.1) * 10, math.sin(angle * 0.1) * 5);
    final rightLobePath = Path()
      ..addOval(Rect.fromCenter(
        center: rightLobeCenter + const Offset(15, 0),
        width: radius * 1.5,
        height: radius * 1.1,
      ));

    final rightLobePaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.3, -0.4),
        colors: [
          const Color(0xFFF43F5E),
          const Color(0xFFBE123C),
          const Color(0xFF4C0519),
        ],
        stops: const [0.0, 0.65, 1.0],
      ).createShader(Rect.fromCircle(center: rightLobeCenter, radius: radius));
    canvas.drawPath(rightLobePath, rightLobePaint);

    // 2. Organic Left Lobe
    final leftLobeCenter = rightLobeCenter + const Offset(-65, 10);
    final leftLobePath = Path()
      ..addOval(Rect.fromCenter(
        center: leftLobeCenter,
        width: radius * 1.1,
        height: radius * 0.85,
      ));

    final leftLobePaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.2, -0.3),
        colors: [
          const Color(0xFFE11D48),
          const Color(0xFF9F1239),
          const Color(0xFF4C0519),
        ],
      ).createShader(Rect.fromCircle(center: leftLobeCenter, radius: radius * 0.8));
    canvas.drawPath(leftLobePath, leftLobePaint);

    // 3. Vascular Network (Portal & Hepatic Veins)
    if (showVessels) {
      final vesselPaint = Paint()
        ..color = const Color(0xFF06B6D4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4.5
        ..strokeCap = StrokeCap.round;

      final vesselPath = Path()
        ..moveTo(center.dx - 80, center.dy + 30)
        ..cubicTo(
          center.dx - 20, center.dy - 10,
          center.dx + 20, center.dy + 25,
          center.dx + 65, center.dy - 15,
        );
      canvas.drawPath(vesselPath, vesselPaint);

      // 60FPS Vascular Particle Streams
      final particlePaint = Paint()..color = const Color(0xFF67E8F9);
      for (int i = 0; i < 15; i++) {
        final t = ((i / 15) + progress * 0.8) % 1.0;
        final particleX = center.dx - 80 + (145 * t);
        final particleY = center.dy + 10 + math.sin(t * math.pi * 2) * 18;
        canvas.drawCircle(Offset(particleX, particleY), 3.0, particlePaint);
      }
    }

    // 4. Target Lesion Node (Segment VI)
    final lesionCenter = rightLobeCenter + const Offset(35, -20);
    final lesionPulse = 1.0 + math.sin(progress * math.pi * 8) * 0.12;

    final lesionPaint = Paint()
      ..shader = RadialGradient(
        colors: [const Color(0xFFFDE047), const Color(0xFFF59E0B), const Color(0xFFD97706)],
      ).createShader(Rect.fromCircle(center: lesionCenter, radius: 18 * lesionPulse));
    canvas.drawCircle(lesionCenter, 16 * lesionPulse, lesionPaint);

    // Holographic Reticle Ring
    final reticlePaint = Paint()
      ..color = const Color(0xFFF43F5E)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawCircle(lesionCenter, 28 * lesionPulse, reticlePaint);

    final outerReticlePaint = Paint()
      ..color = const Color(0xFF06B6D4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    canvas.drawCircle(lesionCenter, 38, outerReticlePaint);

    // 5. Multi-Planar Slice Plane Cutter
    if (showPlane) {
      final planePaint = Paint()
        ..color = const Color(0xFF3B82F6).withOpacity(0.22)
        ..style = PaintingStyle.fill;
      final planeBorder = Paint()
        ..color = const Color(0xFF3B82F6)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;

      final planeY = center.dy + math.sin(progress * math.pi * 2) * 35;

      if (sliceMode == 'axial') {
        final planeRect = Rect.fromLTWH(center.dx - 120, planeY, 240, 10);
        canvas.drawRect(planeRect, planePaint);
        canvas.drawRect(planeRect, planeBorder);
      } else if (sliceMode == 'coronal') {
        final planeRect = Rect.fromLTWH(center.dx - 10, center.dy - 90, 20, 180);
        canvas.drawRect(planeRect, planePaint);
        canvas.drawRect(planeRect, planeBorder);
      } else { // sagittal
        final planePath = Path()
          ..moveTo(center.dx - 100, center.dy - 60)
          ..lineTo(center.dx + 100, center.dy + 60);
        canvas.drawPath(planePath, planeBorder);
      }
    }
  }

  @override
  bool shouldRepaint(covariant Liver3DPainter oldDelegate) => true;
}
