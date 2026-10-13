import 'package:flutter/material.dart';
import 'models/patient.dart';
import 'services/api_service.dart';
import 'widgets/liver_3d_painter.dart';
import 'screens/login_screen.dart';
import 'screens/overview_screen.dart';
import 'screens/patients_screen.dart';
import 'screens/lab_risk_screen.dart';
import 'screens/lirads_screen.dart';
import 'screens/predictions_screen.dart';

void main() {
  runApp(const HepatoCopilotApp());
}

class HepatoCopilotApp extends StatelessWidget {
  const HepatoCopilotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HepatoCopilot Doctor Dashboard',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF090D16),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF111827),
          error: Color(0xFFF43F5E),
        ),
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  bool _isAuthenticated = true;
  String _activeTab = 'Overview';
  List<Patient> _patients = [];

  void _loadPatients() async {
    final list = await ApiService.getPatients();
    setState(() => _patients = list);
  }

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  void _showPatientDetail(Patient p) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF111827),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: p.riskTier == 'High' ? const Color(0xFFF43F5E).withOpacity(0.2) : const Color(0xFF10B981).withOpacity(0.2),
              child: Text(p.initials, style: TextStyle(color: p.riskTier == 'High' ? const Color(0xFFF43F5E) : const Color(0xFF10B981), fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                Text('${p.id} · ${p.mrn} · ${p.gender} · ${p.age} y/o', style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
              ],
            ),
          ],
        ),
        content: SizedBox(
          width: 480,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('HCC RISK PROBABILITY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFF43F5E))),
                          Text('${(p.riskScore * 100).round()}%', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('SERUM AFP LEVEL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                          Text('${p.afp.round()} ng/mL', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Clinical Notes:', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFF090D16), borderRadius: BorderRadius.circular(8)),
                child: Text(p.notes.isNotEmpty ? p.notes.first : 'Routine clinical surveillance.', style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close', style: TextStyle(color: Color(0xFF06B6D4))),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return LoginScreen(onLogin: () => setState(() => _isAuthenticated = true));
    }

    return Scaffold(
      body: Row(
        children: [
          // Flutter Sidebar Navigation
          Container(
            width: 240,
            color: const Color(0xFF0D1322),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF06B6D4),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.show_chart, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 10),
                    const Text('HepatoCopilot', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                  ],
                ),
                const SizedBox(height: 32),

                _NavTile(title: 'Overview', icon: Icons.dashboard, isActive: _activeTab == 'Overview', onTap: () => setState(() => _activeTab = 'Overview')),
                _NavTile(title: 'Patients & Cohorts', icon: Icons.people, isActive: _activeTab == 'Patients', onTap: () => setState(() => _activeTab = 'Patients')),
                _NavTile(title: 'Lab Risk Engine', icon: Icons.science, isActive: _activeTab == 'Lab Risk', onTap: () => setState(() => _activeTab = 'Lab Risk')),
                _NavTile(title: 'LI-RADS v2018', icon: Icons.track_changes, isActive: _activeTab == 'LI-RADS', onTap: () => setState(() => _activeTab = 'LI-RADS')),
                _NavTile(title: 'AI Predictions', icon: Icons.psychology, isActive: _activeTab == 'Predictions', onTap: () => setState(() => _activeTab = 'Predictions')),

                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: const [
                      CircleAvatar(radius: 16, backgroundColor: Color(0xFF3B82F6), child: Text('DR', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white))),
                      SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Dr. Riley Chen', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          Text('Hepatology', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Main View Router
          Expanded(
            child: Container(
              color: const Color(0xFF090D16),
              child: _buildActiveView(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveView() {
    switch (_activeTab) {
      case 'Overview':
        return OverviewScreen(patients: _patients, onSelectPatient: _showPatientDetail);
      case 'Patients':
        return PatientsScreen(patients: _patients, onSelectPatient: _showPatientDetail);
      case 'Lab Risk':
        return const LabRiskScreen();
      case 'LI-RADS':
        return const LiradsScreen();
      case 'Predictions':
        return const PredictionsScreen();
      default:
        return OverviewScreen(patients: _patients, onSelectPatient: _showPatientDetail);
    }
  }
}

class _NavTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _NavTile({
    required this.title,
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        onTap: onTap,
        dense: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        tileColor: isActive ? const Color(0xFF3B82F6).withOpacity(0.15) : Colors.transparent,
        leading: Icon(icon, color: isActive ? const Color(0xFF06B6D4) : const Color(0xFF9CA3AF), size: 20),
        title: Text(title, style: TextStyle(color: isActive ? Colors.white : const Color(0xFF9CA3AF), fontWeight: isActive ? FontWeight.bold : FontWeight.normal, fontSize: 13)),
      ),
    );
  }
}
