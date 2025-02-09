from django import forms
from .models import Rooms

class RoomForm(forms.ModelForm):
    class Meta:
        model = Rooms
        fields = ['name']  # Vous pouvez ajouter plus de champs si nécessaire
