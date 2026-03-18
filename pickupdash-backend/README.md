# Endpoints

---

### POST /api/auth/register

Inscrire un nouvel utilisateur.

**Corps de la requête :**
```json
{
  "email": "",
  "password": ""
}
```

**Réponse succès (201) :**
```json
{
  "message": "User created successfully."
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 400 | "Email and password are required." |
| 400 | "Password must be at least 8 characters." |
| 409 | "Email already in use." |

---

### POST /api/auth/login

Authentifier un utilisateur.

**Corps de la requête :**
```json
{
  "email": "",
  "password": ""
}
```

**Réponse succès (200) :**
```json
{
  "accessToken": "",
  "refreshToken": ""
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 400 | "Email and password are required." |
| 401 | "Invalid credentials." |

---

### POST /api/auth/refresh

Rafraîchir le token d'accès.

**Corps de la requête :**
```json
{
  "refreshToken": ""
}
```

**Réponse succès (200) :**
```json
{
  "accessToken": ""
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 400 | "Refresh token is required." |
| 401 | "Invalid refresh token." |
| 401 | "Refresh token has expired." |

---

### GET /api/users/me

Récupérer le profil de l'utilisateur connecté.

**Headers :** `Authorization: Bearer <accessToken>`

**Réponse succès (200) :**
```json
{
  "email": "",
  "platform": {
    "linked": true
  },
  "emailAccount": {
    "linked": true,
    "provider": "gmail",
    "email": ""
  }
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 404 | "User not found." |

---

### GET /api/packages

Récupérer tous les colis de l'utilisateur connecté.

**Headers :** `Authorization: Bearer <accessToken>`

**Paramètres de requête :**
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 10 | Nombre de résultats par page |
| `status` | string | - | Filtrer par statut |

**Réponse succès (200) :**
```json
{
  "data": [
    {
      "id": "",
      "orderId": "",
      "trackingCode": "",
      "carrierCode": "",
      "trackingUrl": "",
      "carrierLogoUrl": "",
      "lockerName": "",
      "lockerAddress": "",
      "lockerPostalCode": "",
      "lockerCity": "",
      "retrievalCode": "",
      "qrCodeData": "",
      "status": "AVAILABLE_FOR_PICKUP",
      "expiryDate": "",
      "order": {
        "id": "",
        "conversationId": "",
        "transactionId": "",
        "title": "",
        "priceAmount": 0,
        "priceCurrency": "",
        "itemPhotoUrl": ""
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "lastSync": "2026-03-18T00:00:00.000Z"
  }
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |

---

### POST /api/packages/synchronize

Synchroniser les colis avec l'API externe.

**Headers :** `Authorization: Bearer <accessToken>`

**Réponse succès (200) :**
```json
{
  "message": "Sync completed successfully.",
  "lastSync": "2026-03-18T00:00:00.000Z"
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 400 | "Platform account not linked." |
| 500 | "Sync failed. Please try again." |

---

### PATCH /api/packages/:id

Mettre à jour un colis.

**Headers :** `Authorization: Bearer <accessToken>`

**Corps de la requête :**
```json
{
  "status": "DELIVERED"
}
```

**Réponse succès (200) :**
```json
{
  "status": "DELIVERED"
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 404 | "Package not found." |
| 403 | "Access denied." |
| 400 | "Invalid status. Allowed: AVAILABLE_FOR_PICKUP, DELIVERED, EXPIRED, IN_TRANSIT" |

---

## Plateforme

---

### POST /api/platform

Lier un compte Platform.

**Headers :** `Authorization: Bearer <accessToken>`

**Corps de la requête :**
```json
{
  "accessToken": "",
  "refreshToken": ""
}
```

**Réponse succès (200) :**
```json
{
  "message": "Platform account linked successfully."
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 400 | "Authorization code is required." |
| 400 | "Failed to exchange code for tokens." |
| 500 | "Failed to link Platform account." |

---

### DELETE /api/platform

Délier le compte Platform.

**Headers :** `Authorization: Bearer <accessToken>`

**Réponse succès (200) :**
```json
{
  "message": "Platform account unlinked successfully."
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 404 | "Platform account not found." |

---

## Email

---

### GET /api/emails/oauth/authorize

Obtenir l'URL d'authentification Google (OAuth 2.0).

**Headers :** `Authorization: Bearer <accessToken>`

**Réponse succès (200) :**
```json
{
  "authUrl": ""
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |

---

### POST /api/emails/oauth/callback

Lier un compte Gmail après autorisation OAuth.

**Headers :** `Authorization: Bearer <accessToken>`

**Corps de la requête :**
```json
{
  "code": ""
}
```

**Réponse succès (200) :**
```json
{
  "message": "Gmail account linked successfully.",
  "email": ""
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 400 | "Authorization code is required." |
| 500 | "Failed to exchange code for tokens." |
| 500 | "Failed to link Gmail account." |

---

### POST /api/emails

Lier un compte email avec credentials IMAP (Outlook, Hotmail, Yahoo).

**Headers :** `Authorization: Bearer <accessToken>`

**Corps de la requête :**
```json
{
  "provider": "outlook",
  "email": "",
  "password": ""
}
```

**Réponse succès (200) :**
```json
{
  "message": "Email account linked successfully.",
  "provider": "outlook",
  "email": ""
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 400 | "Provider is required." |
| 400 | "Invalid provider. Allowed: outlook, hotmail, yahoo" |
| 400 | "Email and password are required." |
| 400 | "Failed to connect. Check your credentials." |
| 500 | "Failed to link email account." |

---

### DELETE /api/emails

Délier le compte email.

**Headers :** `Authorization: Bearer <accessToken>`

**Réponse succès (200) :**
```json
{
  "message": "Email account unlinked successfully."
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 401 | "No token provided." |
| 401 | "Invalid token." |
| 404 | "Email account not found." |
