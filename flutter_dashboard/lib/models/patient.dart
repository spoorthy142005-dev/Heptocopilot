class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String mrn;
  final double riskScore;
  final String riskTier;
  final double afp;
  final String initials;
  final String tone;
  final List<String> notes;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.mrn,
    required this.riskScore,
    required this.riskTier,
    required this.afp,
    required this.initials,
    required this.tone,
    required this.notes,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      age: json['age'] ?? 0,
      gender: json['gender'] ?? 'Male',
      mrn: json['mrn'] ?? 'MRN-88120',
      riskScore: (json['risk_score'] as num?)?.toDouble() ?? 0.5,
      riskTier: json['risk_tier'] ?? 'Low',
      afp: (json['afp'] as num?)?.toDouble() ?? 10.0,
      initials: json['initials'] ?? '',
      tone: json['tone'] ?? 'low',
      notes: List<String>.from(json['notes'] ?? []),
    );
  }
}

class LabRiskResult {
  final double hccProbability;
  final String riskTier;
  final Map<String, dynamic> scores;
  final Map<String, dynamic> interpretations;
  final List<String> flags;

  LabRiskResult({
    required this.hccProbability,
    required this.riskTier,
    required this.scores,
    required this.interpretations,
    required this.flags,
  });

  factory LabRiskResult.fromJson(Map<String, dynamic> json) {
    return LabRiskResult(
      hccProbability: (json['hcc_probability'] as num?)?.toDouble() ?? 0.0,
      riskTier: json['risk_tier'] ?? 'Low',
      scores: Map<String, dynamic>.from(json['scores'] ?? {}),
      interpretations: Map<String, dynamic>.from(json['interpretations'] ?? {}),
      flags: List<String>.from(json['flags'] ?? []),
    );
  }
}

class LiradsResult {
  final String category;
  final String title;
  final double hccProbability;
  final String description;
  final String recommendation;
  final String color;

  LiradsResult({
    required this.category,
    required this.title,
    required this.hccProbability,
    required this.description,
    required this.recommendation,
    required this.color,
  });

  factory LiradsResult.fromJson(Map<String, dynamic> json) {
    return LiradsResult(
      category: json['category'] ?? 'LR-3',
      title: json['title'] ?? 'Intermediate',
      hccProbability: (json['hcc_probability'] as num?)?.toDouble() ?? 0.38,
      description: json['description'] ?? '',
      recommendation: json['recommendation'] ?? '',
      color: json['color'] ?? 'moderate',
    );
  }
}
