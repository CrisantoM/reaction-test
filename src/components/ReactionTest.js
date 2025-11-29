import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/ReactionTest.css';

const ReactionTest = ({ user }) => {
  const [gameState, setGameState] = useState('idle'); // idle, waiting, ready, clicked, finished
  const [lights, setLights] = useState([false, false, false, false, false]); // Start with lights OFF
  const [reactionTime, setReactionTime] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const startTimeRef = useRef(null);
  const timeoutIdsRef = useRef([]);

  const clearAllTimeouts = () => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  const startTest = () => {
    setGameState('waiting');
    setLights([false, false, false, false, false]); // Start with all lights OFF
    setReactionTime(null);
    setError('');
    clearAllTimeouts();

    // Turn ON lights 1-5 sequentially (1 second each - realistic F1 timing)
    const lightTimings = [1000, 2000, 3000, 4000, 5000];
    
    lightTimings.forEach((timing, index) => {
      const id = setTimeout(() => {
        setLights(prev => {
          const newLights = [...prev];
          newLights[index] = true; // Turn light ON
          return newLights;
        });
      }, timing);
      timeoutIdsRef.current.push(id);
    });

    // Turn OFF all lights randomly 1-5 seconds after all lights are on
    const randomDelay = 6000 + Math.random() * 4000; // Between 1-5 seconds after last light turns on
    const id = setTimeout(() => {
      setLights([false, false, false, false, false]); // All lights OFF at once
      setGameState('ready');
      startTimeRef.current = Date.now();
    }, randomDelay);
    timeoutIdsRef.current.push(id);
  };

  const handleClick = async () => {
    if (gameState === 'ready') {
      const endTime = Date.now();
      const reaction = endTime - startTimeRef.current;
      setReactionTime(reaction);
      setGameState('finished');
      
      // Save to database
      await saveResult(reaction);
    } else if (gameState === 'waiting') {
      // Clicked too early
      setError('Too early! Wait for all lights to go out.');
      setGameState('idle');
      clearAllTimeouts();
      setLights([false, false, false, false, false]);
    }
  };

  const saveResult = async (reactionTimeMs) => {
    setSaving(true);
    try {
      // Insert test result
      const { error: insertError } = await supabase
        .from('test_results')
        .insert({
          user_id: user.id,
          reaction_time: reactionTimeMs,
          taken_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      console.log('Test result saved successfully!');
    } catch (err) {
      console.error('Error saving test result:', err);
      setError('Failed to save result: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetTest = () => {
    setGameState('idle');
    setLights([false, false, false, false, false]); // Start with lights OFF
    setReactionTime(null);
    setError('');
    clearAllTimeouts();
  };

  const getResultMessage = () => {
    if (!reactionTime) return '';
    
    if (reactionTime < 200) return 'Simply Lovely!';
    if (reactionTime < 250) return 'Incredible!';
    if (reactionTime < 300) return 'Excellent!';
    if (reactionTime < 400) return 'Good Job!';
    if (reactionTime < 500) return 'Not bad!';
    return 'Try Again!';
  };

  return (
    <div className="reaction-test">
      <h2>Reaction Test</h2>

      <div className="test-instructions">
        <p>
          This reaction test is designed to test and improve your reflexes. Inspired by F1, watch as the lights illuminate one by one and then go out together just like in a real F1 race. Once all the lights are out, click as quickly as possible to record your reaction time. <br/>
          Continue taking this test to improve your average and climb up the leaderboard!
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* F1 Start Lights */}
      <div className="lights-container">
        {lights.map((isOn, index) => (
          <div key={index} className="light-column">
            <div className={`light ${isOn ? 'on' : 'off'}`}></div>
          </div>
        ))}
      </div>

      {/* Click Zone */}
      <div 
        className={`click-zone ${gameState === 'ready' ? 'active' : ''} ${gameState === 'waiting' ? 'waiting' : ''}`}
        onClick={handleClick}
      >
        {gameState === 'idle' && <span>Click "Start Test" below</span>}
        {gameState === 'waiting' && <span>Wait for lights...</span>}
        {gameState === 'ready' && <span className="pulse">CLICK NOW!</span>}
        {gameState === 'finished' && (
          <div className="result-display">
            <div className="reaction-time">{reactionTime} ms</div>
            <div className="result-message">{getResultMessage()}</div>
            {saving && <div className="saving-text">Saving result...</div>}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="test-controls">
        {gameState === 'idle' && (
          <button className="start-test-btn" onClick={startTest}>
            Start Test
          </button>
        )}
        {gameState === 'finished' && (
          <button className="retry-btn" onClick={resetTest}>
            Take Test Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ReactionTest;