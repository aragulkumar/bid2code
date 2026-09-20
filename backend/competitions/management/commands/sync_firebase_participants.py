import requests
import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from competitions.models import Participant
from django.conf import settings

class Command(BaseCommand):
    help = 'Syncs participants registered on Firebase Firestore into PostgreSQL/Django database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--project-id',
            type=str,
            default='bit2code-2026',
            help='Firebase Project ID'
        )
        parser.add_argument(
            '--json-file',
            type=str,
            default=None,
            help='Path to local JSON export of Firestore participants collection (optional)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=== SYNCING FIREBASE REGISTERED PARTICIPANTS ==="))
        
        project_id = options.get('project_id')
        json_file = options.get('json_file')
        participants_data = []

        if json_file:
            self.stdout.write(f"Reading from local JSON file: {json_file}")
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    participants_data = json.load(f)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to read JSON file: {e}"))
                return
        else:
            # Fetch from Firestore REST API
            firestore_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/participants"
            self.stdout.write(f"Connecting to Firestore: {firestore_url}")
            try:
                resp = requests.get(firestore_url, timeout=10)
                if resp.status_code == 200:
                    docs = resp.json().get('documents', [])
                    for doc in docs:
                        fields = doc.get('fields', {})
                        item = {k: list(v.values())[0] for k, v in fields.items()}
                        participants_data.append(item)
                    self.stdout.write(f"Found {len(participants_data)} participants in Firestore.")
                else:
                    self.stdout.write(self.style.WARNING(f"Firestore REST query returned status {resp.status_code} ({resp.text[:100]})"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Could not connect to Firestore REST endpoint directly: {e}"))

        if not participants_data:
            self.stdout.write(self.style.NOTICE("No new remote records found. Existing registered accounts in database remain intact."))
            return

        synced_count = 0
        for item in participants_data:
            email = item.get('email', '').strip()
            username = item.get('username') or email.split('@')[0]
            name = item.get('name') or item.get('full_name') or username

            if not email:
                continue

            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': email}
            )
            # Set default password if new
            if not user.password:
                user.set_password('bit2code2026')
                user.save()

            count = Participant.objects.count() + 1
            anon_label = item.get('anonymous_label') or f"P{count:02d}"

            participant, created = Participant.objects.update_or_create(
                user=user,
                defaults={
                    'name': name,
                    'email': email,
                    'phone': item.get('phone', ''),
                    'college': item.get('college', ''),
                    'department': item.get('department', ''),
                    'year_of_study': item.get('year_of_study', 'Year 2'),
                    'github_profile': item.get('github_profile', ''),
                    'linkedin_profile': item.get('linkedin_profile', ''),
                    'anonymous_label': anon_label,
                    'balance': int(item.get('balance', 1000)),
                    'is_active_participant': True,
                }
            )
            synced_count += 1
            self.stdout.write(f" -> Synced: {participant.anonymous_label} ({participant.name}) [{participant.email}]")

        self.stdout.write(self.style.SUCCESS(f"Successfully synced {synced_count} participants into PostgreSQL!"))
