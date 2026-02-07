
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const GppCrmApp());
}

class GppCrmApp extends StatelessWidget {
  const GppCrmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        // Add other providers here (LeadsProvider, VisitsProvider)
      ],
      child: MaterialApp(
        title: 'GPP CRM',
        debugShowCheckedModeBanner: false,
        theme: _buildTheme(),
        home: const AuthGate(),
      ),
    );
  }

  ThemeData _buildTheme() {
    final base = ThemeData.light();
    return base.copyWith(
      primaryColor: const Color(0xFF2563EB), // Modern Tech Blue
      colorScheme: base.colorScheme.copyWith(
        primary: const Color(0xFF2563EB),
        secondary: const Color(0xFF3B82F6),
        surface: const Color(0xFFF8FAFC),
      ),
      scaffoldBackgroundColor: const Color(0xFFF1F5F9), // Slate 100
      textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        titleLarge: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        color: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF0F172A),
        centerTitle: false,
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    
    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }
    
    return const DashboardScreen();
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text("GPP CRM", style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text("Enterprise Edition", style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 48),
              _LoginButton(label: "Login as Head Admin", email: "kaadarsh664@gmail.com"),
              _LoginButton(label: "Login as Staff", email: "staff@gpp.com"),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoginButton extends StatelessWidget {
  final String label;
  final String email;
  
  const _LoginButton({required this.label, required this.email});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(double.infinity, 50),
          backgroundColor: Theme.of(context).primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onPressed: () {
          Provider.of<AuthService>(context, listen: false).login(email);
        },
        child: Text(label),
      ),
    );
  }
}
