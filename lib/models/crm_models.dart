
// Extra file for clean architecture
class Lead {
  final String id;
  final String businessName;
  final String subDivision;
  final String status;
  final DateTime lastContact;

  Lead({required this.id, required this.businessName, required this.subDivision, required this.status, required this.lastContact});
}

class Visit {
  final String id;
  final String leadId;
  final DateTime scheduledTime;
  final String? outcome;
  final String? gpsProof;

  Visit({required this.id, required this.leadId, required this.scheduledTime, this.outcome, this.gpsProof});
}
