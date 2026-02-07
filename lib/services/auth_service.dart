
import 'package:flutter/material.dart';

enum UserRole { headAdmin, admin, staff }

class AppUser {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String? profilePhotoUrl;

  AppUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.profilePhotoUrl,
  });
}

class AuthService extends ChangeNotifier {
  AppUser? _currentUser;
  
  // Mock Data for Logic demonstration
  final AppUser _headAdmin = AppUser(
    id: 'admin_001',
    email: 'kaadarsh664@gmail.com',
    name: 'Aadarsh (Head)',
    role: UserRole.headAdmin,
  );

  final AppUser _staffUser = AppUser(
    id: 'staff_005',
    email: 'staff@gpp.com',
    name: 'Field Agent 1',
    role: UserRole.staff,
  );

  bool get isAuthenticated => _currentUser != null;
  AppUser? get currentUser => _currentUser;

  // Strict Permission Getters
  bool get canViewAllLogs => _currentUser?.role == UserRole.headAdmin;
  bool get canOverrideConstraints => _currentUser?.role == UserRole.headAdmin;
  bool get canEditSensitiveData => _currentUser?.role != UserRole.staff;
  
  void login(String email) {
    // In production, this would call Firebase Auth
    if (email == 'kaadarsh664@gmail.com') {
      _currentUser = _headAdmin;
    } else {
      _currentUser = _staffUser;
    }
    notifyListeners();
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }

  // Profile Logic: Audit Log for name change would happen here in a real Firestore call
  Future<void> updateProfileName(String newName) async {
    if (_currentUser == null) return;
    
    // Simulating Firestore Audit Log Trigger
    print("AUDIT LOG: User ${_currentUser!.id} changed name from ${_currentUser!.name} to $newName");
    
    // Update local state
    _currentUser = AppUser(
      id: _currentUser!.id,
      email: _currentUser!.email,
      name: newName,
      role: _currentUser!.role,
      profilePhotoUrl: _currentUser!.profilePhotoUrl,
    );
    notifyListeners();
  }
}
