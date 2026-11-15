export interface ParsedFirebaseAuthError {
  code: string;
  message: string;
  domain?: string;
  uid?: string;
  consoleSettingsUrl?: string;
  consoleUsersUrl?: string;
  firestoreUrl?: string;
}

export function extractFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) {
      return code.trim();
    }
  }
  const msg = error instanceof Error ? error.message : String(error ?? '');
  const match = msg.match(/\((auth\/[a-z0-9-]+)\)/i);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }
  return 'auth/unknown';
}

export function buildFirebaseConsoleUrls(projectId: string, databaseId?: string) {
  const settingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  const providersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
  const usersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/users`;
  const firestoreUrl = databaseId
    ? `https://console.firebase.google.com/project/${projectId}/firestore/databases/${databaseId}/data`
    : `https://console.firebase.google.com/project/${projectId}/firestore`;

  return { settingsUrl, providersUrl, usersUrl, firestoreUrl };
}

export function parseFirebaseAuthError(
  error: unknown,
  currentHostname: string,
  projectId: string,
  options?: { uid?: string; databaseId?: string }
): ParsedFirebaseAuthError {
  const code = extractFirebaseErrorCode(error);
  const cleanHost = currentHostname.trim() || 'localhost';
  const { settingsUrl, providersUrl, usersUrl, firestoreUrl } = buildFirebaseConsoleUrls(
    projectId,
    options?.databaseId
  );

  switch (code) {
    case 'auth/unauthorized-domain':
      return {
        code,
        domain: cleanHost,
        consoleSettingsUrl: settingsUrl,
        message: `Bu domen (${cleanHost}) hələ Firebase Authentication icazəli domenlər siyahısına əlavə edilməyib.`,
      };
    case 'auth/missing-email':
      return {
        code,
        uid: options?.uid,
        consoleSettingsUrl: settingsUrl,
        consoleUsersUrl: usersUrl,
        firestoreUrl,
        message:
          'Firebase Authentication bu layihədə e-poçtsuz hesab (Multi-account) rejimində yaradıldığı üçün e-poçt ünvanı oxuna bilmədi.',
      };
    case 'auth/popup-blocked':
      return {
        code,
        message:
          'Brauzer giriş pəncərəsini blokladı. Zəhmət olmasa brauzerdə pop-up icazəsini aktivləşdirib yenidən cəhd edin.',
      };
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return {
        code,
        message: 'Google giriş pəncərəsi tamamlanmadan bağlandı. Yenidən cəhd edin.',
      };
    case 'auth/network-request-failed':
      return {
        code,
        message: 'Şəbəkə xətası baş verdi. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.',
      };
    case 'auth/operation-not-allowed':
      return {
        code,
        consoleSettingsUrl: providersUrl,
        message: 'Google ilə giriş metodu Firebase layihəsində hələ aktiv edilməyib.',
      };
    default: {
      const raw = error instanceof Error ? error.message : 'Google ilə giriş zamanı xəta baş verdi.';
      return {
        code,
        message: raw,
      };
    }
  }
}
