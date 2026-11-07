import os
from gtts import gTTS

# Data JSON utuh dari lo
data = [
  {
    "t": 2,
    "type": "mcq",
    "audio": "audio/listening-01.mp3",
    "audioText": "I brush my teeth before breakfast.",
    "q": "What does the speaker do before breakfast?",
    "id": "Apa yang dilakukan pembicara sebelum sarapan?",
    "o": ["Eats breakfast", "Brushes their teeth", "Goes to school", "Watches TV"],
    "a": 1,
    "e": "Pembicara mengatakan, “I brush my teeth before breakfast.”"
  },
  {
    "t": 2,
    "type": "mcq",
    "audio": "audio/listening-02.mp3",
    "audioText": "Maya goes to school by bus.",
    "q": "How does Maya go to school?",
    "id": "Bagaimana Maya pergi ke sekolah?",
    "o": ["By bus", "By car", "By bicycle", "On foot"],
    "a": 0,
    "e": "Maya pergi ke sekolah dengan bus."
  },
  {
    "t": 2,
    "type": "mcq",
    "audio": "audio/listening-03.mp3",
    "audioText": "Rudi does his homework at four o'clock.",
    "q": "When does Rudi do his homework?",
    "id": "Kapan Rudi mengerjakan PR?",
    "o": ["At three o'clock", "At four o'clock", "At five o'clock", "At six o'clock"],
    "a": 1,
    "e": "Rudi mengerjakan PR pukul empat."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-04.mp3",
    "audioText": "Ben reads a book before bed.",
    "q": "What does Ben read before bed?",
    "id": "Apa yang dibaca Ben sebelum tidur?",
    "o": ["A book", "A newspaper", "A comic", "A magazine"],
    "a": 0,
    "e": "Ben membaca buku sebelum tidur."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-05.mp3",
    "audioText": "Nina swims twice a week.",
    "q": "How often does Nina swim?",
    "id": "Seberapa sering Nina berenang?",
    "o": ["Once a week", "Twice a week", "Every day", "Three times a week"],
    "a": 1,
    "e": "Nina berenang dua kali seminggu."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-06.mp3",
    "audioText": "Tom gets up at eight o'clock on Sundays.",
    "q": "What time does Tom get up on Sundays?",
    "id": "Pukul berapa Tom bangun pada hari Minggu?",
    "o": ["At six o'clock", "At seven o'clock", "At eight o'clock", "At nine o'clock"],
    "a": 2,
    "e": "Tom bangun pukul delapan pada hari Minggu."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-07.mp3",
    "audioText": "Lena usually eats breakfast at seven, but on Saturdays she has breakfast at eight.",
    "q": "What time does Lena have breakfast on Saturdays?",
    "id": "Pukul berapa Lena sarapan pada hari Sabtu?",
    "o": ["At seven o'clock", "At eight o'clock", "At nine o'clock", "At half past seven"],
    "a": 1,
    "e": "Pada hari Sabtu, Lena sarapan pukul delapan."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-08.mp3",
    "audioText": "Arif brushes his teeth after breakfast, then walks to school. He never takes the bus.",
    "q": "How does Arif go to school?",
    "id": "Bagaimana Arif pergi ke sekolah?",
    "o": ["By bus", "By bicycle", "On foot", "By car"],
    "a": 2,
    "e": "Arif berjalan kaki ke sekolah dan tidak pernah naik bus."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-09.mp3",
    "audioText": "Mira does her homework every afternoon except Friday. On Fridays, she helps her mother cook dinner.",
    "q": "What does Mira do on Fridays?",
    "id": "Apa yang dilakukan Mira pada hari Jumat?",
    "o": ["She does her homework", "She walks to school", "She helps cook dinner", "She reads before bed"],
    "a": 2,
    "e": "Pada hari Jumat, Mira membantu ibunya memasak makan malam."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-10.mp3",
    "audioText": "Doni plays badminton on Monday, Wednesday, and Friday.",
    "q": "How often does Doni play badminton?",
    "id": "Seberapa sering Doni bermain bulu tangkis?",
    "o": ["Once a week", "Twice a week", "Three times a week", "Every day"],
    "a": 2,
    "e": "Doni bermain bulu tangkis tiga kali seminggu."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-11.mp3",
    "audioText": "Sinta leaves home at half past six and arrives at school at seven o'clock.",
    "q": "What time does Sinta leave home?",
    "id": "Pukul berapa Sinta berangkat dari rumah?",
    "o": ["At six o'clock", "At half past six", "At seven o'clock", "At half past seven"],
    "a": 1,
    "e": "Sinta berangkat dari rumah pukul setengah tujuh."
  },
  {
    "t": 3,
    "type": "mcq",
    "audio": "audio/listening-12.mp3",
    "audioText": "Raka doesn't go to bed at nine. He usually reads for twenty minutes and goes to bed at half past nine.",
    "q": "When does Raka usually go to bed?",
    "id": "Kapan Raka biasanya pergi tidur?",
    "o": ["At nine o'clock", "At twenty past nine", "At half past nine", "At ten o'clock"],
    "a": 2,
    "e": "Raka biasanya membaca selama dua puluh menit lalu tidur pukul setengah sepuluh."
  }
]

# Bikin folder 'audio' sesuai dengan struktur path lo
os.makedirs('audio', exist_ok=True)

# Looping buat generate mp3
for item in data:
    text = item["audioText"]
    filepath = item["audio"]
    
    print(f"Lagi proses: {filepath} -> '{text}'")
    
    # Generate suara (lang='en' buat logat bahasa Inggris)
    tts = gTTS(text=text, lang='en')
    tts.save(filepath)

print("Beres! Semua file .mp3 udah sukses ter-download dan masuk ke folder 'audio/'.")