
import { useState } from 'react';
import axios from 'axios';


const API = 'http://localhost:8080/api';
const today = new Date().toISOString().slice(0, 10);

export default function App() {

    
    const [checkIn, setCheckIn] = useState(today);
    const [checkOut, setCheckOut] = useState('');
    const [category, setCategory] = useState('');

    const [rooms, setRooms] = useState([]);
    const [selected, setSelected] = useState(null);

    const [guestName, setGuestName] = useState('');
    const [phone, setPhone] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);


    // Search Available Rooms
    async function search(e) {
        e.preventDefault();

        setError('');
        setSuccess('');
        setRooms([]);
        setSelected(null);

        // Date Validation
        if (!checkIn || !checkOut || checkOut <= checkIn) {
            setError('Check-out date must be after check-in date');
            return;
        }

        try {
            setLoading(true);

            const res = await axios.get(`${API}/availability`, {
                params: {
                    checkIn,
                    checkOut,
                    category: category || undefined
                }
            });

            setRooms(res.data);

            if (!res.data.length) {
                setSuccess('No rooms available for the selected dates.');
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to search rooms.'
            );

        } finally {
            setLoading(false);
        }
    }


    
    async function book(e) {
        e.preventDefault();

        setError('');
        setSuccess('');

        if (!selected) {
            setError('Please select a room first.');
            return;
        }

        // Phone Number Validation
        if (!/^\d{10}$/.test(phone)) {
            setError('Phone number must contain exactly 10 digits.');
            return;
        }

        try {
            setLoading(true);

            const res = await axios.post(`${API}/bookings`, {
                roomId: selected.roomId,
                guestName,
                phone,
                checkIn,
                checkOut
            });

            setSuccess(
                `Booking confirmed! Booking ID: ${res.data.bookingId} · Room ${res.data.roomNumber}`
            );

            setGuestName('');
            setPhone('');
            setSelected(null);

            await searchAfterBooking();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Booking failed. Please try again.'
            );

        } finally {
            setLoading(false);
        }
    }


    // Refresh Available Rooms After Booking
    async function searchAfterBooking() {
        try {
            const res = await axios.get(`${API}/availability`, {
                params: {
                    checkIn,
                    checkOut,
                    category: category || undefined
                }
            });

            setRooms(res.data);

        } catch (err) {
            console.error('Error refreshing rooms:', err);
        }
    }


    // Currency Formatter
    const money = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };


    // UI Rendering
    return (
        <main className="shell">

            {/* Header Section */}
            <header>
                <div className="brand">
                    N<span>·</span>
                </div>

                <div>
                    <p className="eyebrow">NIMBA NATURE CURE</p>
                    <h1>Nimba Stay</h1>
                    <p className="sub">
                        A calmer way to manage your rooms.
                    </p>
                </div>

                <span className="staff">FRONT DESK</span>
            </header>


            {/* Room Search Section */}
            <section className="panel">

                <div className="section-title">
                    <div>
                        <p className="eyebrow">ROOM FINDER</p>
                        <h2>Find your guest a room</h2>
                    </div>

                    <span className="step">01 / SEARCH</span>
                </div>

                <form onSubmit={search} className="search-grid">

                    <label>
                        Check-in
                        <input
                            type="date"
                            min={today}
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Check-out
                        <input
                            type="date"
                            min={checkIn || today}
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Room category
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">All categories</option>
                            <option value="STANDARD">Standard</option>
                            <option value="DELUXE">Deluxe</option>
                            <option value="SUITE">Suite</option>
                        </select>
                    </label>

                    <button disabled={loading}>
                        {loading ? 'Please wait…' : 'Search rooms'}
                    </button>

                </form>

                {/* Error and Success Messages */}
                {error && (
                    <div className="alert error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert success">
                        {success}
                    </div>
                )}

            </section>


            {/* Available Rooms Section */}
            <section className="results">

                <div className="section-title">
                    <div>
                        <p className="eyebrow">AVAILABLE ACCOMMODATION</p>
                        <h2>Choose a room</h2>
                    </div>

                    <span className="count">
                        {rooms.length} {rooms.length === 1 ? 'ROOM' : 'ROOMS'} FOUND
                    </span>
                </div>

                {rooms.length === 0 ? (

                    // Empty State
                    <div className="empty">
                        <div className="empty-icon">⌂</div>

                        <h3>Your room options will appear here</h3>

                        <p>
                            Choose your dates and search to see rooms
                            available for the entire stay.
                        </p>
                    </div>

                ) : (

                    // Available Room Cards
                    <div className="room-grid">

                        {rooms.map((r) => (

                            <button
                                type="button"
                                key={r.roomId}
                                className={`room-card ${
                                    selected?.roomId === r.roomId ? 'chosen' : ''
                                }`}
                                onClick={() => setSelected(r)}
                            >

                                <div className="room-top">
                                    <span className="room-category">
                                        {r.category}
                                    </span>

                                    <span className="radio">
                                        {selected?.roomId === r.roomId ? '✓' : ''}
                                    </span>
                                </div>

                                <h3>Room {r.roomNumber}</h3>

                                <p className="per-night">
                                    {money(r.pricePerNight)}
                                    <span> / night</span>
                                </p>

                                <div className="total">
                                    <span>Total stay</span>
                                    <strong>{money(r.totalPrice)}</strong>
                                </div>

                            </button>

                        ))}

                    </div>
                )}

            </section>


            {/* Guest Booking Section */}
            <section className="panel booking">

                <div className="section-title">
                    <div>
                        <p className="eyebrow">GUEST DETAILS</p>
                        <h2>Complete the booking</h2>
                    </div>

                    <span className="step">02 / BOOK</span>
                </div>

                <form onSubmit={book} className="booking-grid">

                    <label>
                        Guest full name
                        <input
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Enter guest name"
                            required
                            maxLength="100"
                        />
                    </label>

                    <label>
                        Mobile number
                        <input
                            value={phone}
                            onChange={(e) =>
                                setPhone(
                                    e.target.value.replace(/\D/g, '').slice(0, 10)
                                )
                            }
                            placeholder="10-digit phone number"
                            inputMode="numeric"
                            required
                        />
                    </label>

                    <div className="selected-room">
                        <span>Selected room</span>

                        <strong>
                            {selected
                                ? `Room ${selected.roomNumber} · ${money(selected.totalPrice)}`
                                : 'Select a room above'
                            }
                        </strong>
                    </div>

                    <button disabled={loading || !selected}>
                        {loading ? 'Processing…' : 'Confirm booking'}
                    </button>

                </form>

            </section>


            {/* Footer */}
            <footer>
                <span>NIMBA STAY</span>
                <span>Simple stays. Thoughtful care.</span>
            </footer>

        </main>
    );
}
