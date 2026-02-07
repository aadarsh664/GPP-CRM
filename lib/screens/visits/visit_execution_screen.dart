
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';

class VisitExecutionScreen extends StatefulWidget {
  final String visitId;
  final String clientName;
  final double clientLat;
  final double clientLng;

  const VisitExecutionScreen({
    super.key,
    required this.visitId,
    required this.clientName,
    required this.clientLat,
    required this.clientLng,
  });

  @override
  State<VisitExecutionScreen> createState() => _VisitExecutionScreenState();
}

class _VisitExecutionScreenState extends State<VisitExecutionScreen> {
  bool _isLoading = false;
  String? _statusMessage;

  Future<void> _processVisitCompletion() async {
    setState(() => _isLoading = true);

    // 1. Check Permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        setState(() => _isLoading = false);
        return;
      }
    }

    // 2. Get Real-Time GPS
    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    // 3. Compare Locations (Anti-Fraud)
    double distanceInMeters = Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      widget.clientLat,
      widget.clientLng,
    );

    // Threshold: 500 meters allowed (GPS drift + office size)
    bool isAtLocation = distanceInMeters < 500;

    if (!isAtLocation) {
      if (mounted) {
        _showFraudWarning(distanceInMeters);
      }
      setState(() => _isLoading = false);
      return;
    }

    // 4. Success - Ask Outcome
    if (mounted) {
      _showOutcomeDialog(position);
    }
  }

  void _showFraudWarning(double distance) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Location Mismatch Warning"),
        content: Text("You are ${(distance / 1000).toStringAsFixed(2)}km away from the client.\n\nYou must be at the client's location to mark the visit as done."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("OK")),
        ],
      ),
    );
  }

  void _showOutcomeDialog(Position proof) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Visit Verified"),
        content: const Text("GPS Proof Captured. What was the outcome?"),
        actions: [
          TextButton(
            child: const Text("Deal Failed", style: TextStyle(color: Colors.red)),
            onPressed: () {
               // Update Firestore: Status=Done, Outcome=Failed, GPS=proof
               Navigator.pop(ctx);
               Navigator.pop(context); // Close Screen
            },
          ),
          ElevatedButton(
            child: const Text("Deal Confirmed"),
            onPressed: () {
               // Update Firestore: Status=Done, Outcome=Won, GPS=proof
               Navigator.pop(ctx);
               Navigator.pop(context); // Close Screen
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Map Marker for Client
    final Set<Marker> markers = {
      Marker(
        markerId: const MarkerId('client'),
        position: LatLng(widget.clientLat, widget.clientLng),
        infoWindow: InfoWindow(title: widget.clientName),
      )
    };

    return Scaffold(
      appBar: AppBar(title: Text(widget.clientName)),
      body: Column(
        children: [
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: LatLng(widget.clientLat, widget.clientLng),
                zoom: 15,
              ),
              markers: markers,
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
            ),
          ),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -5))],
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.info_outline, color: Colors.grey),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Ensure you are at the location before marking done. GPS is logged.",
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _isLoading ? null : _processVisitCompletion,
                    icon: _isLoading 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                      : const Icon(Icons.check_circle_outline),
                    label: const Text("MARK VISIT DONE"),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
