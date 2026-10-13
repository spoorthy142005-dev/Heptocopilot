import 'package:flutter/material.dart';
import '../models/patient.dart';
import '../widgets/liver_3d_painter.dart';

class OverviewScreen extends StatelessWidget {
  final List<Patient> patients;
  final Function(Patient) onSelectPatient;

  const OverviewScreen({
    super.key,
    required this.patients,
    required this.onSelectPatient,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Intro
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'AI CLINICAL INTELLIGENCE',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF06B6D4), letterSpacing: 1.5),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Good morning, Dr. Chen',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  SizedBox(height: 4),
                  Text('Flutter Cross-Platform Clinical Dashboard', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Stat Metrics Grid
          Row(
            children: const [
              Expanded(child: _MetricCard(title: 'Patients Monitored', value: '1,284', icon: Icons.people, color: Color(0xFF3B82F6))),
              SizedBox(width: 16),
              Expanded(child: _MetricCard(title: 'High-Risk Flagged', value: '47', icon: Icons.warning_amber, color: Color(0xFFF43F5E))),
              SizedBox(width: 16),
              Expanded(child: _MetricCard(title: 'Predictions / Wk', value: '186', icon: Icons.psychology, color: Color(0xFF10B981))),
              SizedBox(width: 16),
              Expanded(child: _MetricCard(title: 'Model Accuracy', value: '91.4%', icon: Icons.verified, color: Color(0xFFF59E0B))),
            ],
          ),
          const SizedBox(height: 24),

          // 3D Canvas & Prediction Grid
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 3D Volumetric Canvas Panel
              Expanded(
                flex: 6,
                child: Container(
                  height: 340,
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    border: Border.all(color: const Color(0xFF1F293D)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text('3D Volumetric CT Engine', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          Text('60FPS Flutter Canvas', style: TextStyle(fontSize: 11, color: Color(0xFF10B981))),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: const Liver3DCanvas(sliceMode: 'axial'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 20),

              // Activity Summary Panel
              Expanded(
                flex: 5,
                child: Container(
                  height: 340,
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    border: Border.all(color: const Color(0xFF1F293D)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Prediction Telemetry', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 6),
                      const Text('Weekly risk scoring trend across network', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                      const Spacer(),
                      Center(
                        child: Icon(Icons.bar_chart, size: 140, color: const Color(0xFF06B6D4).withOpacity(0.8)),
                      ),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text('Avg Sensitivity: 89.8%', style: TextStyle(fontSize: 12, color: Colors.white)),
                          Text('Specificity: 93.1%', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Priority Roster Table
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
                const Text('High-Priority Patient Roster', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 16),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: patients.length,
                  separatorBuilder: (_, __) => const Divider(color: Color(0xFF1F293D)),
                  itemBuilder: (context, index) {
                    final p = patients[index];
                    final isHigh = p.riskTier == 'High';
                    final isFemale = p.gender.toLowerCase() == 'female';

                    return ListTile(
                      onTap: () => onSelectPatient(p),
                      leading: CircleAvatar(
                        backgroundColor: isHigh ? const Color(0xFFF43F5E).withOpacity(0.2) : const Color(0xFF10B981).withOpacity(0.2),
                        child: Text(p.initials, style: TextStyle(color: isHigh ? const Color(0xFFF43F5E) : const Color(0xFF10B981), fontWeight: FontWeight.bold)),
                      ),
                      title: Text(p.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: Text('${p.id} · ${p.age} y/o', style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isFemale ? const Color(0xFFEC4899).withOpacity(0.15) : const Color(0xFF06B6D4).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(isFemale ? '♀ Female' : '♂ Male', style: TextStyle(color: isFemale ? const Color(0xFFEC4899) : const Color(0xFF06B6D4), fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 16),
                          Text('${(p.riskScore * 100).round()}% Risk', style: TextStyle(color: isHigh ? const Color(0xFFF43F5E) : const Color(0xFF10B981), fontWeight: FontWeight.bold)),
                          const SizedBox(width: 8),
                          const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF)),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _MetricCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F293D)),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 10),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
        ],
      ),
    );
  }
}
