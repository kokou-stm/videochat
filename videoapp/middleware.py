import datetime
from django.conf import settings
from django.contrib.auth import logout
from django.utils.timezone import now

class AutoLogoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            last_activity = request.session.get('last_activity')
            now_time = now()
            
            # Si la dernière activité existe, vérifiez la différence
            if last_activity:
                elapsed_time = now_time - datetime.datetime.fromisoformat(last_activity)
                if elapsed_time.total_seconds() > settings.SESSION_COOKIE_AGE:
                    logout(request)
            
            # Mettre à jour l'heure de la dernière activité
            request.session['last_activity'] = now_time.isoformat()

        response = self.get_response(request)
        return response
