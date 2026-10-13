import 'package:flutter/material.dart';
import '../models/patient.dart';

class PatientsScreen extends StatefulWidget {
  final List<Patient> patients;
  final Function(Patient) onSelectPatient;

  const PatientsScreen({
    super.key,
    required this.patients,
    required this.onSelectPatient,
  });

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  String _selectedGender = 'All';
  String _selectedTier = 'All';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final filtered = widget.patients.filter((p) {
      final matchesSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase()) || p.id.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesTier = _selectedTier == 'All' || p.riskTier.toLowerCase() == _selectedTier.toLowerCase();
      final matchesGender = _selectedGender == 'All' || p.gender.toLowerCase() == _selectedGender.toLowerCase();
      return matchesSearch && matchesTier && matchesGender;
    }).toList();

    final maleCount = widget.patients.where((p) => p.gender.toLowerCase() == 'male').length;
    final femaleCount = widget.patients.length - maleCount;
    final maleHighRisk = widget.patients.where((p) => p.gender.toLowerCase() == 'male' && p.riskTier == 'High').length;
    final femaleHighRisk = widget.patients.where((p) => p.gender.toLowerCase() == 'female' && p.riskTier == 'High').length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PATIENT MANAGEMENT & DEMOGRAPHICS',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF06B6D4), letterSpacing: 1.5),
          ),
          const SizedBox(height: 6),
          const Text('Patient Roster & Gender Cohorts', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Separate, monitor, and analyze male and female risk cohorts.', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 24),

          // Gender Cohort Demographic Separation Cards
          Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF06B6D4).withOpacity(0.08),
                    border: Border.all(color: const Color(0xFF06B6D4).withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('♂ MALE PATIENT COHORT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF06B6D4))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                            child: Text('$maleHighRisk High Risk', style: const TextStyle(color: Color(0xFFF43F5E), fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('$maleCount Patients', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4),
                      const Text('Monitored male liver disease cohort', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 20),

              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFEC4899).withOpacity(0.08),
                    border: Border.all(color: const Color(0xFFEC4899).withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('♀ FEMALE PATIENT COHORT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFEC4899))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                            child: Text('$femaleHighRisk High Risk', style: const TextStyle(color: Color(0xFFF43F5E), fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('$femaleCount Patients', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4),
                      const Text('Monitored female liver disease cohort', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Filters Bar
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
                Row(
                  children: [
                    // Search box
                    Expanded(
                      flex: 4,
                      child: TextField(
                        onChanged: (val) => setState(() => _searchQuery = val),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Search by patient name or ID…',
                          hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                          prefixIcon: const Icon(Icons.search, color: Color(0xFF9CA3AF)),
                          filled: true,
                          fillColor: const Color(0xFF090D16),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF1F293D))),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Gender separation filter
                    Row(
                      children: [
                        const Text('Gender: ', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, fontWeight: FontWeight.w600)),
                        SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(value: 'All', label: Text('All')),
                            ButtonSegment(value: 'Male', label: Text('♂ Male')),
                            ButtonSegment(value: 'Female', label: Text('♀ Female')),
                          ],
                          selected: {_selectedGender},
                          onSelectionChanged: (val) => setState(() => _selectedGender = val.first),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Roster Table List
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const Divider(color: Color(0xFF1F293D)),
                  itemBuilder: (context, index) {
                    final p = filtered[index];
                    final isHigh = p.riskTier == 'High';
                    final isFemale = p.gender.toLowerCase() == 'female';

                    return ListTile(
                      onTap: () => widget.onSelectPatient(p),
                      leading: CircleAvatar(
                        backgroundColor: isHigh ? const Color(0xFFF43F5E).withOpacity(0.2) : const Color(0xFF10B981).withOpacity(0.2),
                        child: Text(p.initials, style: TextStyle(color: isHigh ? const Color(0xFFF43F5E) : const Color(0xFF10B981), fontWeight: FontWeight.bold)),
                      ),
                      title: Text(p.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: Text('${p.id} · ${p.mrn} · ${p.age} y/o', style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isFemale ? const Color(0xFFEC4899).withOpacity(0.15) : const Color(0xFF06B6D4).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: isFemale ? const Color(0xFFEC4899).withOpacity(0.4) : const Color(0xFF06B6D4).withOpacity(0.4)),
                            ),
                            child: Text(isFemale ? '♀ Female' : '♂ Male', style: TextStyle(color: isFemale ? const Color(0xFFEC4899) : const Color(0xFF06B6D4), fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 16),
                          Text('${(p.riskScore * 100).round()}% Risk', style: TextStyle(color: isHigh ? const Color(0xFFF43F5E) : const Color(0xFF10B981), fontWeight: FontWeight.bold)),
                          const SizedBox(width: 12),
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
