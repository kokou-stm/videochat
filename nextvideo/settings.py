"""
Django settings for nextvideo project.

Generated by 'django-admin startproject' using Django 4.2.7.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""
import os

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-(_r8&+xf5=z(%m55lkj^p52#p87-cna&wf3&44t386iex*(haf'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True  

ALLOWED_HOSTS = ["b5ae-46-193-67-154.ngrok-free.app", "aivoicedubber.com","414f-46-193-67-154.ngrok-free.app", "127.0.0.1"]#, ,"localhost","videoadd.fggbdpcqfnguf4ga.eastus.azurecontainer.io", "aivoicedubber.com"]
CSRF_TRUSTED_ORIGINS =["https://*.aivoicedubber.com","https://*.b5ae-46-193-67-154.ngrok-free.app", "https://b5ae-46-193-67-154.ngrok-free.app"]#,"https://aivoicedubber.com",  "https://.*aivoicedubber.com"]



# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'daphne',
    'django.contrib.staticfiles',
    'videoapp',
    'channels',
    
  
   # 'corsheaders',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
]

ROOT_URLCONF = 'nextvideo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, "templates")],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# settings.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}


WSGI_APPLICATION = 'nextvideo.wsgi.application'
ASGI_APPLICATION = 'nextvideo.asgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'videoapp/static/'

# The absolute path to the directory where collectstatic will collect static files for deployment.
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Additional locations the staticfiles app will traverse if the FileSystemFinder finder is enabled.
STATICFILES_DIRS = [
    BASE_DIR / "videoapp/static",
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend'
PERCENT=0
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT= 587
EMAIL_USE_TLS= True
EMAIL_HOST_USER=os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD=os.getenv('EMAIL_HOST_PASSWORD')
EMAIL_USE_SSL = False  # Assurez-vous que c'est désactivé si TLS est activé

LOGIN_URL = 'login'
LOGOUT_REDIRECT_URL = 'login'


# Durée de vie maximale d'une session (30 jours)
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # En secondes

# La session expire si le navigateur est fermé
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Optionnel : Activez la persistance de la session
SESSION_SAVE_EVERY_REQUEST = True
