from django.db import models
from django.contrib.auth.models import User
import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now, timedelta


class VerificationCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_code')
    code = models.CharField(max_length=6, unique=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_code(self):
        self.code = str(uuid.uuid4().int)[:6]
        self.save()


class Meeting(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Nom du canal
    password = models.CharField(max_length=100)  # Mot de passe de la réunion
    created_at = models.DateTimeField(auto_now_add=True)  # Date de création
    users = models.ManyToManyField(User, related_name='channels')
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_meeting', blank=True) 
    host_users = models.ManyToManyField(User, related_name='hosted_users', blank=True) 
    def __str__(self):
        return self.name


class Rooms(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Nom unique de la salle
    created_at = models.DateTimeField(auto_now_add=True)  # Date de création
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_rooms')  # L'hôte de la salle
    active = models.BooleanField(default=True)  
    channel = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='room', null=True, blank=True) 
    users = models.ManyToManyField(User, related_name='rooms', blank=True) 

    def __str__(self):
        return self.name


class ChatFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_files')  # Fichiers liés à un utilisateur
    file = models.FileField(upload_to='uploads/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File by {self.user.username} at {self.created_at}"


class Messageschat(models.Model):
    identifiant = models.IntegerField(null= True, blank=True)
    text = models.CharField(max_length=255, null = True, blank=True)


class Chatmessages(models.Model):
    channel = models.ForeignKey(Meeting, on_delete=models.CASCADE)
    messages = models.JSONField(blank=True, null=True)
    messages_chat = models.JSONField(blank=True, null=True)
    
    def add_message(self, message):
        """Ajoute un message à l'historique JSON et limite à 50 messages max."""
        messages = self.messages
        messages.append(message)

        if len(messages) > 50:  # Limite le stockage à 50 messages
            messages.pop(0)

        self.messages = messages
        self.save()


class ActiveUser(models.Model):
    user = models.ManyToManyField(User, related_name='active_users',   blank=True)
    room_name = models.CharField(max_length=255)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.room_name})"
    

class Discussion(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Nom unique de la discussion
    users = models.ManyToManyField(User, related_name='active_discussions', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class DiscussionMessage(models.Model):
    discussion = models.ForeignKey(Discussion, related_name='messages', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Utilisateur qui a envoyé le message
    content = models.TextField(blank=True, null=True)  # Message texte
    file = models.FileField(upload_to="uploads/", blank=True, null=True)  # Fichier
    created_at = models.DateTimeField(auto_now_add=True)  # Date et heure de création

    def __str__(self):
        return f"Message from {self.user.username} at {self.created_at}"


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    duration_days = models.IntegerField()  # Durée de l'abonnement

    def __str__(self):
        return self.name

class UserSubscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    def is_active(self):
        return self.end_date >= now()

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"


'''class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plan = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=6, decimal_places=2)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    def is_active(self):
        return self.end_date >= now()'''



from django.utils.timezone import now, timedelta

class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plan = models.CharField(max_length=50, default="unknown")  # free, basique, hebdomadaire, illimitee
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    credit_minutes = models.IntegerField(default=300)  # Free: 5h
    trial_end_date = models.DateTimeField(null=True, blank=True)  # Date de fin du trial

    def is_in_trial(self):
        if self.trial_end_date and now() < self.trial_end_date:
            return True
        return False

    def is_active(self):
        if self.is_in_trial():
            return True
        return self.end_date is None or self.end_date >= now()

    def deduct_minutes(self, minutes):
        if self.plan == "basique":
            self.credit_minutes = max(0, self.credit_minutes - minutes)
            self.save()

    def add_credits(self, minutes):
        if self.plan == "basique":
            self.credit_minutes += minutes
            self.save()

    def upgrade(self, plan):
        self.plan = plan.lower()
        self.start_date = now()

        # Activer un trial de 14 jours pour tous les plans payants
        if plan.lower() in ['basique', 'hebdomadaire', 'illimitee']:
            self.trial_end_date = now() + timedelta(days=14)

        if plan.lower() == 'illimitee':
            self.end_date = now() + timedelta(days=30)  # Après trial
        elif plan.lower() == 'hebdomadaire':
            self.end_date = now() + timedelta(days=7)   # Après trial
        elif plan.lower() == 'basique':
            self.credit_minutes += 600  # Recharge 10h
            self.end_date = None  # Pas de renouvellement automatique
        elif plan.lower() == 'free':
            self.trial_end_date = None  # Pas de trial pour gratuit
            self.end_date = None

        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.plan}"
    



from django.db import models
from django.contrib.auth.models import User

class PaymentCard(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='payment_card')
    card_number = models.CharField(max_length=16, blank=True, null=True)  # Placeholder, stocké en clair ici (non sécurisé)
    expiry_date = models.CharField(max_length=5, blank=True, null=True)   # Format MM/YY
    cvv = models.CharField(max_length=4, blank=True, null=True)           # 3-4 chiffres
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['card_number', 'expiry_date', 'cvv'], name='unique_card_triplet')
        ]
    def __str__(self):
        return f"Carte de {self.user.username}"