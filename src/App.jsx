import { useState, useEffect } from "react";
import Login from "./components/Login";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import Playlist from "./components/Playlist";
import logo from "./assets/logo.png";
import "./App.css";
import { getCodeChallenge, generateRandomString } from "./utils/pkce";

function App() {
  // --- State variables ---
  const [results, setResults] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [playlist, setPlaylist] = useState([]);
  const [token, setToken] = useState("");

  // --- On mount, check for a Spotify auth code ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("code")) {
      const code = urlParams.get("code");
      const storedVerifier = localStorage.getItem("code_verifier");
      // Exchange the authorization code for an access token.
      fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: "56de6914b0ff425b91c22549a95629e5",
          grant_type: "authorization_code",
          code: code,
          redirect_uri: "https://impulsepro.netlify.app/",
          code_verifier: storedVerifier,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setToken(data.access_token);
          // Remove the code from the URL
          window.history.pushState({}, null, "/");
        })
        .catch((error) => console.error("Error getting token:", error));
    }
  }, []);

  // --- Function to trigger the Spotify login (PKCE) ---
  const getAccessToken = async () => {
    const verifier = generateRandomString(128);
    localStorage.setItem("code_verifier", verifier);
    const challenge = await getCodeChallenge(verifier);
    const params = new URLSearchParams({
      client_id: "56de6914b0ff425b91c22549a95629e5",
      response_type: "code",
      redirect_uri: "https://impulsepro.netlify.app/",
      code_challenge_method: "S256",
      code_challenge: challenge,
      scope: "playlist-modify-private playlist-modify-public",
    });
    window.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  // --- Search functions ---
  const handleSearch = async () => {
    if (!userInput) return;
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(userInput)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    // Map each track’s essential data.
    if (data.tracks && data.tracks.items) {
      const tracks = data.tracks.items.map((track) => ({
        id: track.id,
        name: track.name,
        album: track.album.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        albumArt: track.album.images[0] ? track.album.images[0].url : "",
        spotifyLink: track.external_urls.spotify,
      }));
      setResults(tracks);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // --- Playlist functions ---
  const handlePlaylistNameChange = (e) => {
    setPlaylistName(e.target.value);
  };

  const isTrackInPlaylist = (trackId) => {
    return playlist.some((track) => track.id === trackId);
  };

  const handleAddToPlaylist = (track) => {
    if (!isTrackInPlaylist(track.id)) {
      setPlaylist((prev) => [...prev, track]);
    }
  };

  const handleRemoveFromPlaylist = (track) => {
    setPlaylist((prev) => prev.filter((t) => t.id !== track.id));
  };

  const handleToggleTrackInPlaylist = (track) => {
    if (isTrackInPlaylist(track.id)) {
      handleRemoveFromPlaylist(track);
    } else {
      handleAddToPlaylist(track);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName || playlist.length === 0) return;
    // First, get the current user’s Spotify profile.
    try {
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!userResponse.ok) {
      console.error("Error fetching user data:", userResponse.statusText);
      return alert("Error fetching user data. Please check your token.");
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Create a new playlist.
    const playlistResponse = await fetch(
      `https://api.spotify.com/v1/me/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          public: false,
        }),
      }
    );
    if (!playlistResponse.ok) {
      console.error("Error creating playlist:", playlistResponse.statusText);
      return alert("Error creating playlist.");
    }
    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;

    if (!playlistId) {
      console.error("Playlist creation failed:", playlistData);
      return alert("Error: Playlist ID missing.");
    }
    // Add tracks to the newly created playlist.
    const uris = playlist.map((track) => {
      if (!track.id) {
        console.warn("Track missing id:", track);
      } 
      return `spotify:track:${track.id}`;

    });

    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris }),
      }
    );
    if (!tracksResponse.ok) {
      console.error("Error adding tracks:", tracksResponse.statusText);
      return alert("Error adding tracks to the playlist.");
    }
    // Reset the playlist and name.
    setPlaylist([]);
    setPlaylistName("");
    alert("Playlist uploaded successfully!");
  } catch (error) {
    console.log("Unexpected error:", error);
    alert("An unexpected error occurred. Check the console for details.");
  }
  };

  // --- Log out ---
  const handleLogout = () => {
    setToken("");
  };

  // If no access token, render the login page.
  if (!token) {
    return <Login getAccessToken={getAccessToken} />;
  }

  return (

    <div className="app">
    <div className="amorphous-gradient"></div>
     <header className="header-container">
      <img src={logo} alt="Logo" className="logo" />
      <button className="logout-button" onClick={handleLogout}>Log Out</button>
    </header>
      <SearchBar
        userInput={userInput}
        setUserInput={setUserInput}
        handleSubmit={handleSubmit}
      />
      <div className="results-and-playlist">
        <SearchResults
          results={results}
          onToggleTrack={handleToggleTrackInPlaylist}
          isTrackInPlaylist={isTrackInPlaylist}
        />
        <Playlist
          playlist={playlist}
          playlistName={playlistName}
          handlePlaylistNameChange={handlePlaylistNameChange}
          handleCreatePlaylist={handleCreatePlaylist}
          onToggleTrack={handleToggleTrackInPlaylist}
          isTrackInPlaylist={isTrackInPlaylist}
        />
      </div>

    </div>
  );
}

export default App;

