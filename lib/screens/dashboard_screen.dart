
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'leads/leads_card.dart';
import 'visits/visit_execution_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).currentUser;
    final isDesktop = MediaQuery.of(context).size.width > 900;

    final tabs = [
      _NavDestination(icon: Icons.filter_list_alt, label: 'Leads', body: const LeadsView()),
      _NavDestination(icon: Icons.calendar_month_outlined, label: 'Calendar', body: const Center(child: Text("Calendar (Smart Blocking)"))),
      _NavDestination(icon: Icons.directions_walk, label: 'Visits', body: const VisitsListView()),
      _NavDestination(icon: Icons.people_outline, label: 'Clients', body: const Center(child: Text("Clients (8 Day Loop)"))),
      if (user?.role == UserRole.headAdmin)
         _NavDestination(icon: Icons.dashboard, label: 'Admin', body: const Center(child: Text("Admin Dashboard Charts"))),
    ];

    if (isDesktop) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: _selectedIndex,
              onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
              labelType: NavigationRailLabelType.all,
              leading: const Padding(
                padding: EdgeInsets.all(16.0),
                child: Icon(Icons.print, color: Color(0xFF2563EB), size: 32),
              ),
              destinations: tabs.map((t) => NavigationRailDestination(
                icon: Icon(t.icon),
                label: Text(t.label),
              )).toList(),
            ),
            const VerticalDivider(thickness: 1, width: 1),
            Expanded(child: tabs[_selectedIndex].body),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tabs[_selectedIndex].label, style: const TextStyle(fontWeight: FontWeight.bold)),
            if (user != null) 
              Text("User: ${user.name}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Provider.of<AuthService>(context, listen: false).logout(),
          )
        ],
      ),
      body: tabs[_selectedIndex].body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: tabs.map((t) => NavigationDestination(
          icon: Icon(t.icon),
          label: t.label,
        )).toList(),
      ),
    );
  }
}

class _NavDestination {
  final IconData icon;
  final String label;
  final Widget body;
  _NavDestination({required this.icon, required this.label, required this.body});
}

// Placeholder for Visits List
class VisitsListView extends StatelessWidget {
  const VisitsListView({super.key});

  @override
  Widget build(BuildContext context) {
    // In a real app, fetch from Firestore 'visits' collection filtering by staff_id
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 2,
      itemBuilder: (context, index) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.store, color: Colors.blue),
            ),
            title: const Text("City Offset Printers"),
            subtitle: const Text("Scheduled: 2:00 PM • 3.2km away"),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
               // Client Coords passed here
               Navigator.push(context, MaterialPageRoute(
                 builder: (_) => VisitExecutionScreen(
                   visitId: "v_$index", 
                   clientName: "City Offset Printers", 
                   clientLat: 25.610000, 
                   clientLng: 85.160000 // Close to office
                 )
               ));
            },
          ),
        );
      },
    );
  }
}

class LeadsView extends StatelessWidget {
  const LeadsView({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        LeadCard(
          businessName: "Ravi Graphics",
          subDivision: "Kankarbagh",
          distanceKm: 4.5,
          status: "New",
        ),
        SizedBox(height: 12),
        LeadCard(
          businessName: "Patna Press",
          subDivision: "Boring Road",
          distanceKm: 12.1,
          status: "Call Later",
        ),
      ],
    );
  }
}
