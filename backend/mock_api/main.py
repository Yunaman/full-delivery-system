from flask import Flask, request, jsonify, abort
from dataclasses import dataclass, asdict
from typing import List, Dict

app = Flask(__name__)

_orders: Dict[int, dict] = {}
_next_order_id = 1


@dataclass
class OrderItem:
    name: str
    quantity: int
    unit_price: float


def parse_token(auth_header: str):
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) != 2:
        return None
    scheme, token = parts
    if scheme.lower() != 'bearer' or not token.startswith('mock-token'):
        return None
    # token format mock-token-<username>
    parts = token.split('-', 2)
    username = parts[-1] if len(parts) >= 3 else 'unknown'
    return {'username': username}


@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    body = request.get_json() or {}
    username = body.get('username')
    password = body.get('password')
    if not username or not password:
        return jsonify({'error': 'missing credentials'}), 400
    return jsonify({'access_token': f'mock-token-{username}', 'token_type': 'bearer'})


@app.route('/api/v1/orders', methods=['POST'])
def create_order():
    user = parse_token(request.headers.get('Authorization'))
    if not user:
        return jsonify({'detail': 'unauthorized'}), 401
    global _next_order_id
    body = request.get_json() or {}
    items = body.get('items', [])
    total = body.get('total_amount', 0)
    order_id = _next_order_id
    _next_order_id += 1
    order = {
        'id': order_id,
        'customer': user['username'],
        'total_amount': total,
        'status': 'created',
        'items': items,
    }
    _orders[order_id] = order
    return jsonify(order), 201


@app.route('/api/v1/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    user = parse_token(request.headers.get('Authorization'))
    if not user:
        return jsonify({'detail': 'unauthorized'}), 401
    order = _orders.get(order_id)
    if not order:
        abort(404)
    return jsonify(order)


@app.route('/api/v1/payments', methods=['POST'])
def payments():
    user = parse_token(request.headers.get('Authorization'))
    if not user:
        return jsonify({'detail': 'unauthorized'}), 401
    body = request.get_json() or {}
    amount = body.get('amount')
    return jsonify({'status': 'succeeded', 'amount': amount, 'id': 'pay_mock_123'}), 201


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)
