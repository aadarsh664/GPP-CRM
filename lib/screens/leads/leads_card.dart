
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';

class LeadCard extends StatefulWidget {
  final String businessName;
  final String subDivision;
  final double distanceKm;
  final String status;

  const LeadCard({
    super.key,
    required this.businessName,
    required this.subDivision,
    required this.distanceKm,
    required this.status,
  });

  @override
  State<LeadCard> createState() => _LeadCardState();
}

class _LeadCardState extends State<LeadCard> {
  late String _currentStatus;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.status;
  }

  void _handleStatusChange(String? newStatus) {
    if (newStatus == null) return;

    if (newStatus == 'Schedule Visit') {
      _showScheduler();
    } else if (newStatus == 'Not Interested') {
      _showReasonDialog(newStatus);
    } else {
      // For Call Later/Old Lead
      setState(() => _currentStatus = newStatus);
    }
  }

  void _showReasonDialog(String targetStatus) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Reason for Rejection"),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(hintText: "E.g. Price too high, Closed..."),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
          ElevatedButton(
            onPressed: () {
              // Log reason to Firestore here
              setState(() => _currentStatus = targetStatus);
              Navigator.pop(ctx);
            },
            child: const Text("Move to Bin"),
          )
        ],
      ),
    );
  }

  void _showScheduler() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    
    // Booking Window Logic: Default 15 days, Admin can override
    int bookingWindow = 15;
    if (auth.canOverrideConstraints) bookingWindow = 60;

    final DateTime now = DateTime.now();
    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(Duration(days: bookingWindow)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(primary: Theme.of(context).primaryColor),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate != null) {
      // 1. Check availability (Logic omitted for brevity)
      // 2. Confirm Booking
      setState(() => _currentStatus = 'Visit Scheduled');
      
      // 3. Prompt WhatsApp Share
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text("Visit Scheduled!"),
            action: SnackBarAction(
              label: "Share on WhatsApp",
              onPressed: () {
                final text = "Hello, your visit with GPP is confirmed for ${DateFormat('MMM dd').format(pickedDate)}.";
                launchUrl(Uri.parse("https://wa.me/?text=$text"));
              },
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    Color statusColor = Colors.blue;
    if (_currentStatus == 'New') statusColor = Colors.green;
    if (_currentStatus == 'Not Interested') statusColor = Colors.red;
    if (_currentStatus == 'Visit Scheduled') statusColor = Colors.purple;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _currentStatus,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: statusColor),
                  ),
                ),
                Text("${widget.distanceKm} km", style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              widget.businessName,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              widget.subDivision,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _IconButton(icon: Icons.call, color: Colors.green, onTap: () {}),
                const SizedBox(width: 12),
                _IconButton(icon: Icons.message, color: Colors.greenAccent, onTap: () {}),
                const Spacer(),
                DropdownButton<String>(
                  underline: const SizedBox(),
                  icon: const Icon(Icons.more_vert),
                  items: const [
                    DropdownMenuItem(value: "New", child: Text("Status: New")),
                    DropdownMenuItem(value: "Call Later", child: Text("Mark: Call Later")),
                    DropdownMenuItem(value: "Schedule Visit", child: Text("📅 Schedule Visit")),
                    DropdownMenuItem(value: "Not Interested", child: Text("⚠️ Not Interested")),
                  ],
                  onChanged: _handleStatusChange,
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}

class _IconButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _IconButton({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 20, color: color),
      ),
    );
  }
}
