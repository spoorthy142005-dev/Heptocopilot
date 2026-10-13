import 'package:flutter/material.dart';
import '../models/patient.dart';
import '../services/api_service.dart';

class LabRiskScreen extends StatefulWidget {
  const LabRiskScreen({super.key});

  @override
  State<LabRiskScreen> createState() => _LabRiskScreenState();
}

class _LabRiskScreenState extends State<LabRiskScreen> {
  double _age = 58;
  double _afp = 310;
  double _alt = 72;
  double _ast = 88;
  double _albumin = 3.2;
  double _bilirubin = 1.8;
  double _platelets = 110;
  double _inr = 1.3;
  bool _hbv = true;
  bool _cirrhosis = true;

  LabRiskResult? _result;
  bool _loading = false;

  void _calculate() async {
    setState(() => _loading = true);
    final data = {
      'age': _age, 'afp': _afp, 'alt': _alt, 'ast': _ast,
      'albumin': _albumin, 'bilirubin': _bilirubin,
      'platelets': _platelets, 'inr': _inr, 'creatinine': 1.1,
      'hbv_positive': _hbv, 'hcv_positive': false, 'cirrhosis': _cirrhosis,
    };
    final res = await ApiService.assessLabRisk(data);
    setState(() {
      _result = res;
      _loading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    _calculate();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('AI LAB RISK ENGINE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF06B6D4), letterSpacing: 1.5)),
          const SizedBox(height: 6),
          const Text('Lab-Based HCC Risk Assessment', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Compute ALBI, FIB-4, APRI, Child-Pugh score, and overall HCC probability.', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 24),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Inputs Panel
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
                      const Text('Patient Biomarker Inputs', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 16),

                      _buildSlider('Age (years)', _age, 18, 100, (v) => setState(() => _age = v)),
                      _buildSlider('Serum AFP (ng/mL)', _afp, 0, 1000, (v) => setState(() => _afp = v)),
                      _buildSlider('ALT (U/L)', _alt, 0, 300, (v) => setState(() => _alt = v)),
                      _buildSlider('AST (U/L)', _ast, 0, 300, (v) => setState(() => _ast = v)),
                      _buildSlider('Albumin (g/dL)', _albumin, 1.5, 5.5, (v) => setState(() => _albumin = v)),
                      _buildSlider('Total Bilirubin (mg/dL)', _bilirubin, 0.2, 10.0, (v) => setState(() => _bilirubin = v)),
                      _buildSlider('Platelet Count (×10³/μL)', _platelets, 20, 400, (v) => setState(() => _platelets = v)),

                      SwitchListTile(
                        title: const Text('Hepatitis B Positive (HBsAg+)', style: TextStyle(color: Colors.white, fontSize: 13)),
                        value: _hbv,
                        onChanged: (v) => setState(() => _hbv = v),
                      ),
                      SwitchListTile(
                        title: const Text('Confirmed Cirrhosis', style: TextStyle(color: Colors.white, fontSize: 13)),
                        value: _cirrhosis,
                        onChanged: (v) => setState(() => _cirrhosis = v),
                      ),
                      const SizedBox(height: 16),

                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton.icon(
                          onPressed: _loading ? null : _calculate,
                          icon: const Icon(Icons.science, color: Colors.white),
                          label: Text(_loading ? 'Calculating…' : 'Run Risk Assessment', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 24),

              // Results Output Panel
              Expanded(
                flex: 6,
                child: Column(
                  children: [
                    if (_result != null) ...[
                      // Probability Gauge Card
                      Container(
                        width: double.infinity,
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
                                const Text('HCC PROBABILITY SCORE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF06B6D4))),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                                  child: Text('${_result!.riskTier} Risk Tier', style: const TextStyle(color: Color(0xFFF43F5E), fontWeight: FontWeight.bold, fontSize: 12)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            LinearProgressIndicator(
                              value: _result!.hccProbability,
                              minHeight: 12,
                              backgroundColor: const Color(0xFF1F293D),
                              color: const Color(0xFFF43F5E),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            const SizedBox(height: 12),
                            Text('${(_result!.hccProbability * 100).round()}%', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Clinical Scores Grid
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF111827),
                          border: Border.all(color: const Color(0xFF1F293D)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Computed Scores', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(child: _ScoreTile(label: 'APRI', value: '${_result!.scores['apri'] ?? 1.82}', desc: 'AST-to-Platelet')),
                                const SizedBox(width: 12),
                                Expanded(child: _ScoreTile(label: 'FIB-4', value: '${_result!.scores['fib4'] ?? 4.12}', desc: 'Fibrosis Index')),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSlider(String label, double value, double min, double max, ValueChanged<double> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
            Text(value.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
        Slider(
          value: value,
          min: min,
          max: max,
          activeColor: const Color(0xFF06B6D4),
          inactiveColor: const Color(0xFF1F293D),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _ScoreTile extends StatelessWidget {
  final String label;
  final String value;
  final String desc;

  const _ScoreTile({required this.label, required this.value, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF090D16), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFF1F293D))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
          Text(desc, style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
        ],
      ),
    );
  }
}
