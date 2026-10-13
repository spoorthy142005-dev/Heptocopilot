import 'package:flutter/material.dart';
import '../models/patient.dart';
import '../services/api_service.dart';

class LiradsScreen extends StatefulWidget {
  const LiradsScreen({super.key});

  @override
  State<LiradsScreen> createState() => _LiradsScreenState();
}

class _LiradsScreenState extends State<LiradsScreen> {
  double _sizeMm = 24;
  String _aphe = 'nonperipheral';
  bool _washout = true;
  bool _capsule = true;
  bool _growth = false;
  bool _vein = false;

  LiradsResult? _result;

  void _eval() async {
    final data = {
      'size_mm': _sizeMm,
      'aphe': _aphe,
      'washout': _washout,
      'capsule': _capsule,
      'threshold_growth': _growth,
      'tumor_in_vein': _vein,
    };
    final res = await ApiService.assessLirads(data);
    setState(() => _result = res);
  }

  @override
  void initState() {
    super.initState();
    _eval();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('ACR LI-RADS v2018 CALCULATOR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF06B6D4), letterSpacing: 1.5)),
          const SizedBox(height: 6),
          const Text('Liver Imaging Reporting & Data System', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Standardized diagnostic categorization for CT and MRI liver observations.', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
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
                      const Text('Radiological Imaging Features', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 16),

                      Text('Lesion Diameter: ${_sizeMm.round()} mm', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      Slider(
                        value: _sizeMm,
                        min: 5, max: 100,
                        activeColor: const Color(0xFF06B6D4),
                        onChanged: (v) {
                          setState(() => _sizeMm = v);
                          _eval();
                        },
                      ),
                      const SizedBox(height: 12),

                      SwitchListTile(
                        title: const Text('Nonperipheral Washout', style: TextStyle(color: Colors.white, fontSize: 13)),
                        value: _washout,
                        onChanged: (v) { setState(() => _washout = v); _eval(); },
                      ),
                      SwitchListTile(
                        title: const Text('Enhancing Capsule Appearance', style: TextStyle(color: Colors.white, fontSize: 13)),
                        value: _capsule,
                        onChanged: (v) { setState(() => _capsule = v); _eval(); },
                      ),
                      SwitchListTile(
                        title: const Text('Threshold Growth (≥50% increase ≤6mo)', style: TextStyle(color: Colors.white, fontSize: 13)),
                        value: _growth,
                        onChanged: (v) { setState(() => _growth = v); _eval(); },
                      ),
                      SwitchListTile(
                        title: const Text('Soft Tissue Tumor in Vein (LR-TIV)', style: TextStyle(color: Colors.white, fontSize: 13)),
                        value: _vein,
                        onChanged: (v) { setState(() => _vein = v); _eval(); },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 24),

              // Output Badge Panel
              Expanded(
                flex: 5,
                child: Container(
                  height: 360,
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    border: Border.all(color: const Color(0xFF1F293D)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_result != null) ...[
                        const Text('DIAGNOSTIC CATEGORY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF06B6D4), letterSpacing: 1.5)),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF43F5E).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF43F5E)),
                          ),
                          child: Text(_result!.category, style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E))),
                        ),
                        const SizedBox(height: 16),
                        Text(_result!.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(height: 8),
                        Text(_result!.description, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFF090D16), borderRadius: BorderRadius.circular(8)),
                          child: Text('Recommendation: ${_result!.recommendation}', style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                        ),
                      ],
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
}
