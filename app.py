from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

MARKET_DATA = {
    "essentials": {
        "Teff (Magna)": ["14,500 ETB/Q", "up"],
        "Bread": ["10 ETB", "steady"],
        "Coffee": ["620 ETB/kg", "down"]
    },
    "fuel": {
        "Benzene": ["112.40 ETB/L", "up"],
        "Diesel": ["108.20 ETB/L", "steady"]
    },
    "currency": {
        "USD/ETB (Bank)": "154.50",
        "USD/ETB (Parallel)": "156  .20"
    }
}

DISTANCE_MAP = {
    ("Bole", "Piazza"): 7.5,
    ("Bole", "Megenagna"): 4.8,
    ("Bole", "Mexico"): 6.2,
    ("Bole", "CMC"): 9.2,
    ("Megenagna", "Piazza"): 6.5,
    ("Megenagna", "Mexico"): 8.1,
    ("Megenagna", "CMC"): 4.5,
    ("Piazza", "Mexico"): 3.5,
    ("Piazza", "4 Kilo"): 2.1,
    ("Mexico", "Sarbet"): 4.2,
    ("Lideta", "Mexico"): 1.8,
    "default": 5.0
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/market')
def get_market():
    return jsonify(MARKET_DATA)

@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.json
    start = data.get('start')
    dest = data.get('dest')

    
    dist = DISTANCE_MAP.get((start, dest)) or DISTANCE_MAP.get((dest, start)) or DISTANCE_MAP.get("default")


    return jsonify({
        "distance": f"{dist} KM",
        "economy": f"{int(80 + (dist * 18))} ETB",
        "ride": f"{int(130 + (dist * 45))} ETB",
        "bus": "15-30 ETB",
        "taxi": f"{int(100 + (dist * 20))} ETB"
    })

if __name__ == '__main__':
    app.run(debug=True)