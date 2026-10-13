import 'package:flutter/material.dart';

class PredictionsScreen extends StatefulWidget {
  const PredictionsScreen({super.key});

  @override
  State<PredictionsScreen> createState() => _PredictionsScreenState();
}

class _PredictionsScreenState extends State<PredictionsScreen> {
  double _blend = 60;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('PYTORCH DEEP LEARNING FRAMEWORK · CONVNEXT-SMALL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFEE4C2C), letterSpacing: 1.5)),
          const SizedBox(height: 6),
          const Text('AI Lesion Classification & Grad-CAM', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('PyTorch v2.2 CUDA-accelerated pathology predictions paired with visual explainability maps.', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 24),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Grad-CAM Heatmap Viewer Panel
              Expanded(
                flex: 5,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    border: Border.all(color: const Color(0xFF1F293D)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Grad-CAM Explainability Map', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 16),
                      Container(
                        height: 240,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFF090D16),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFF1F293D)),
                        ),
                        child: Center(
                          child: Icon(Icons.remove_red_eye, size: 80, color: const Color(0xFFF43F5E).withOpacity(_blend / 100)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Raw CT Image', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                          Text('Heatmap Blend: ${_blend.round()}%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          const Text('Grad-CAM Overlay', style: TextStyle(color: Color(0xFF06B6D4), fontSize: 12)),
                        ],
                      ),
                      Slider(
                        value: _blend,
                        min: 0, max: 100,
                        activeColor: const Color(0xFF06B6D4),
                        onChanged: (v) => setState(() => _blend = v),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 24),

              // Pathology Probabilities Output Panel
              Expanded(
                flex: 5,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    border: Border.all(color: const Color(0xFF1F293D)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Classifier Prediction', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                            child: const Text('HCC Detected', style: TextStyle(color: Color(0xFFF43F5E), fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      _buildProbBar('Hepatocellular Carcinoma (HCC)', 0.88, const Color(0xFFF43F5E)),
                      const SizedBox(height: 16),
                      _buildProbBar('Benign Hemangioma', 0.08, const Color(0xFF10B981)),
                      const SizedBox(height: 16),
                      _buildProbBar('Hepatic Metastasis', 0.04, const Color(0xFFF59E0B)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProbBar(String label, double val, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${(val * 100).round()}%', style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 6),
        LinearProgressIndicator(
          value: val,
          minHeight: 8,
          backgroundColor: const Color(0xFF1F293D),
          color: color,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }
}
