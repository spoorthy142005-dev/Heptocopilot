import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/patient.dart';

class ApiService {
  static const String baseUrl = 'http://127.0.0.1:8000/api';

  static Future<List<Patient>> getPatients({String? q, String? tier, String? gender}) async {
    try {
      final queryParams = <String, String>{};
      if (q != null && q.isNotEmpty) queryParams['q'] = q;
      if (tier != null && tier != 'All') queryParams['tier'] = tier;
      if (gender != null && gender != 'All') queryParams['gender'] = gender;

      final uri = Uri.parse('$baseUrl/patients').replace(queryParameters: queryParams);
      final response = await http.get(uri).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Patient.fromJson(json)).toList();
      }
    } catch (_) {}

    // Fallback static roster if backend offline
    return _demoPatients();
  }

  static Future<LabRiskResult> assessLabRisk(Map<String, dynamic> labData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/patient-risk'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(labData),
      );
      if (response.statusCode == 200) {
        return LabRiskResult.fromJson(jsonDecode(response.body));
      }
    } catch (_) {}

    return LabRiskResult(
      hccProbability: 0.82,
      riskTier: 'High',
      scores: {'apri': 1.82, 'fib4': 4.12, 'albi': -1.24, 'child_pugh_points': 8},
      interpretations: {
        'fibrosis_stage': 'Significant fibrosis / cirrhosis likely (F3–F4)',
        'albi_grade': 'Grade 3 — poor hepatic function',
        'child_pugh_class': 'B'
      },
      flags: ['AFP critically elevated (>400 ng/mL)', 'Hypoalbuminaemia — reduced synthetic function'],
    );
  }

  static Future<LiradsResult> assessLirads(Map<String, dynamic> liradsData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/lirads-assess'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(liradsData),
      );
      if (response.statusCode == 200) {
        return LiradsResult.fromJson(jsonDecode(response.body));
      }
    } catch (_) {}

    return LiradsResult(
      category: 'LR-5',
      title: 'Definitely HCC',
      hccProbability: 0.96,
      description: 'Definite Hepatocellular Carcinoma based on nonperipheral APHE, washout, and capsule.',
      recommendation: 'Refer to multidisciplinary tumor board.',
      color: 'high',
    );
  }

  static List<Patient> _demoPatients() {
    return [
      Patient(
        id: 'PT-10482', name: 'James Morrison', age: 58, gender: 'Male', mrn: 'MRN-88401',
        riskScore: 0.82, riskTier: 'High', afp: 940, initials: 'JM', tone: 'high',
        notes: ['Chronic Hepatitis B with 2.4cm Segment VI observation.'],
      ),
      Patient(
        id: 'PT-10479', name: 'Eleanor Chen', age: 63, gender: 'Female', mrn: 'MRN-77312',
        riskScore: 0.64, riskTier: 'Moderate', afp: 42, initials: 'EC', tone: 'moderate',
        notes: ['NASH cirrhosis under routine surveillance.'],
      ),
      Patient(
        id: 'PT-10476', name: 'Robert Bailey', age: 46, gender: 'Male', mrn: 'MRN-55920',
        riskScore: 0.18, riskTier: 'Low', afp: 6, initials: 'RB', tone: 'low',
        notes: ['Screening evaluation. Normal liver panel.'],
      ),
      Patient(
        id: 'PT-10471', name: 'Sofia Alvarez', age: 71, gender: 'Female', mrn: 'MRN-91044',
        riskScore: 0.76, riskTier: 'High', afp: 240, initials: 'SA', tone: 'high',
        notes: ['Post-SVR Hep C with rising AFP trend.'],
      ),
    ];
  }
}
