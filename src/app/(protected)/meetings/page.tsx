"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MeetingUploadCard from "../dashboard/meeting-upload-card";
import MeetingTranscription from "@/components/meeting-transcription";

interface Meeting {
  name: string;
  url: string;
  created_at?: string;
  size?: number;
  location: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentlyTranscribing, setCurrentlyTranscribing] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Create a state to track deleted meeting URLs to ensure they don't reappear
  const [deletedMeetingUrls, setDeletedMeetingUrls] = useState<string[]>([]);
  
  // Load deleted meeting URLs from localStorage on component mount
  useEffect(() => {
    try {
      const savedDeletedUrls = localStorage.getItem('deletedMeetingUrls');
      if (savedDeletedUrls) {
        const parsedUrls = JSON.parse(savedDeletedUrls);
        console.log('Loaded deleted meeting URLs from localStorage:', parsedUrls);
        setDeletedMeetingUrls(parsedUrls);
      }
    } catch (err) {
      console.error('Error loading deleted meeting URLs:', err);
    }
    
    // This will run when the component mounts
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'deletedMeetingUrls' && e.newValue) {
        try {
          const updatedUrls = JSON.parse(e.newValue);
          console.log('Storage event: Updated deleted URLs:', updatedUrls);
          setDeletedMeetingUrls(updatedUrls);
        } catch (err) {
          console.error('Error parsing updated deleted URLs:', err);
        }
      }
    };
    
    // Listen for storage events (in case localStorage is updated in another tab)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Function to get file name without timestamp prefix
  const getDisplayName = (filename: string): string => {
    // Remove timestamp prefix if it exists (e.g., 1746086661404_)
    const parts = filename.split('_');
    if (parts.length > 1 && !isNaN(Number(parts[0]))) {
      return parts.slice(1).join('_').replace(/_/g, ' ');
    }
    return filename.replace(/_/g, ' ');
  };

  // Format date without date-fns
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 30) {
        return date.toLocaleDateString();
      } else if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
      } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
      } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Function to refresh the meetings list
  const refreshMeetings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Refreshing meetings list...");
      
      // Clear any currently playing or transcribing state
      setCurrentlyPlaying(null);
      setCurrentlyTranscribing(null);
      
      // First try to list all files in the bucket to see what's there
      const { data: allFiles, error: allFilesError } = await supabase.storage
        .from("meetings")
        .list();
      
      console.log("All files in bucket:", allFiles);
      
      // Then try the meetings subfolder
      const { data: meetingsData, error: meetingsError } = await supabase.storage
        .from("meetings")
        .list("meetings");
      
      console.log("Files in meetings subfolder:", meetingsData);
      
      // Store debug info
      setDebug({ 
        allFiles,
        allFilesError,
        meetingsSubfolder: meetingsData, 
        meetingsError 
      });
      
      // Combine files from both locations
      let mp3Files = [];
      
      // Add files from root if they exist and are MP3s
      if (allFiles && !allFilesError) {
        const rootMp3s = allFiles.filter(file => 
          file.name && file.name.toLowerCase().endsWith('.mp3')
        );
        
        mp3Files.push(...rootMp3s.map(file => ({
          name: file.name,
          url: supabase.storage.from("meetings").getPublicUrl(file.name).data.publicUrl,
          created_at: file.created_at,
          size: file.metadata?.size,
          location: "root"
        })));
      }
      
      // Add files from meetings subfolder if they exist and are MP3s
      if (meetingsData && !meetingsError) {
        const subfolderMp3s = meetingsData.filter(file => 
          file.name && file.name.toLowerCase().endsWith('.mp3')
        );
        
        mp3Files.push(...subfolderMp3s.map(file => ({
          name: file.name,
          url: supabase.storage.from("meetings").getPublicUrl(`meetings/${file.name}`).data.publicUrl,
          created_at: file.created_at,
          size: file.metadata?.size,
          location: "meetings subfolder"
        })));
      }
      
      console.log("Combined MP3 files:", mp3Files);
      
      // Filter out any meetings that are in the deleted list
      // Use a more robust check that handles URL encoding differences
      mp3Files = mp3Files.filter(meeting => {
        // Check if this meeting URL (or a normalized version) is in our deleted list
        const isDeleted = deletedMeetingUrls.some(deletedUrl => {
          // Try different normalization approaches
          return (
            meeting.url === deletedUrl ||
            decodeURIComponent(meeting.url) === decodeURIComponent(deletedUrl) ||
            meeting.url.includes(deletedUrl) ||
            deletedUrl.includes(meeting.url)
          );
        });
        
        if (isDeleted) {
          console.log('Filtering out deleted meeting:', meeting.name);
        }
        
        return !isDeleted;
      });
      
      // Sort by creation date, newest first
      mp3Files.sort((a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setMeetings(mp3Files);
      
      if (mp3Files.length === 0) {
        console.log("No MP3 files found in any location");
      }
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  // Trigger refresh when component mounts or refreshTrigger changes
  useEffect(() => {
    refreshMeetings();
  }, [refreshTrigger]);

  // Function to handle successful upload
  const handleUploadSuccess = () => {
    console.log("Upload successful, refreshing meetings list");
    // Wait a moment for Supabase to process the upload
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center w-full px-4 pb-6">
      <div className="w-full max-w-3xl mt-4 mb-4 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h2 className="text-xl font-bold">Upload Meeting</h2>
        </div>
        <div className="p-6">
          <MeetingUploadCard onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>
      
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md overflow-hidden mt-0">
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">All Meetings</h2>
            <p className="text-blue-100 text-sm">Listen to your recorded meetings</p>
          </div>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="p-2 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors"
            title="Refresh meetings list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 bg-red-50 p-4 rounded-lg inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-8 text-center">
            <div className="bg-gray-100 rounded-full p-4 inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No meeting recordings found</h3>
            <p className="text-gray-500">Upload your first meeting recording to get started</p>
            {debug && (
              <div className="mt-4 text-left">
                <details>
                  <summary className="text-xs text-gray-500 cursor-pointer">Debug Info (Click to expand)</summary>
                  <pre className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(debug, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {meetings.map((meeting, index) => (
              <div key={meeting.url} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start mb-1">
                  <div className="bg-blue-100 rounded-full p-1.5 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{getDisplayName(meeting.name)}</h3>
                    <div className="flex flex-wrap text-xs text-gray-500 mt-0.5">
                      {meeting.created_at && (
                        <span className="mr-3">
                          Uploaded {formatDate(meeting.created_at)}
                        </span>
                      )}
                      {meeting.size && (
                        <span className="mr-3">{formatFileSize(meeting.size)}</span>
                      )}
                      {meeting.location && (
                        <span className="text-blue-500">({meeting.location})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setCurrentlyTranscribing(currentlyTranscribing === meeting.url ? null : meeting.url);
                        // Close audio player if opening transcription
                        if (currentlyPlaying === meeting.url) {
                          setCurrentlyPlaying(null);
                        }
                      }}
                      className="text-green-600 hover:text-green-800"
                      title="Transcribe with AI"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {currentlyPlaying === meeting.url && (
                  <div className="mt-2 mb-1">
                    <audio 
                      controls 
                      src={meeting.url} 
                      className="w-full" 
                      autoPlay
                      onEnded={() => setCurrentlyPlaying(null)}
                    />
                  </div>
                )}
                
                {currentlyTranscribing === meeting.url && (
                  <div className="mt-1 mb-1">
                    <MeetingTranscription audioUrl={meeting.url} fileName={meeting.name} />
                  </div>
                )}
                
                <div className="flex justify-end mt-1 gap-3">
                  <button
                    onClick={() => {
                      // Navigate to meeting detail page
                      window.location.href = `/meetings/${encodeURIComponent(meeting.location === 'meetings subfolder' ? `meetings/${meeting.name}` : meeting.name)}`;
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    View Meeting
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this meeting?')) {
                        try {
                          // Disable the button during deletion
                          const deleteButton = document.activeElement as HTMLButtonElement;
                          if (deleteButton) {
                            deleteButton.disabled = true;
                            deleteButton.innerText = 'Deleting...';
                          }
                          
                          // Immediately remove from UI for better user experience
                          setMeetings(prevMeetings => prevMeetings.filter(m => m.url !== meeting.url));
                          
                          // Add to deleted meetings list to prevent it from reappearing
                          const updatedDeletedUrls = [...deletedMeetingUrls, meeting.url];
                          console.log('Adding to deleted list:', meeting.url);
                          console.log('New deleted list:', updatedDeletedUrls);
                          setDeletedMeetingUrls(updatedDeletedUrls);
                          
                          // Save multiple versions of the URL to handle encoding differences
                          const urlsToStore = [
                            meeting.url,
                            decodeURIComponent(meeting.url),
                            meeting.name
                          ];
                          
                          // Add all versions to our deleted list
                          const robustDeletedUrls = [...deletedMeetingUrls, ...urlsToStore];
                          
                          // Save to localStorage to persist across page reloads
                          localStorage.setItem('deletedMeetingUrls', JSON.stringify(robustDeletedUrls));
                          
                          // Also save the meeting name separately for extra robustness
                          const deletedNames = JSON.parse(localStorage.getItem('deletedMeetingNames') || '[]');
                          deletedNames.push(meeting.name);
                          localStorage.setItem('deletedMeetingNames', JSON.stringify(deletedNames));
                          
                          // Clear any currently playing or transcribing state if it's this meeting
                          if (currentlyPlaying === meeting.url) {
                            setCurrentlyPlaying(null);
                          }
                          if (currentlyTranscribing === meeting.url) {
                            setCurrentlyTranscribing(null);
                          }
                          
                          // Delete the file from storage
                          const path = meeting.location === 'meetings subfolder' ? `meetings/${meeting.name}` : meeting.name;
                          const { error: storageError } = await supabase.storage
                            .from('meetings')
                            .remove([path]);
                            
                          if (storageError) {
                            console.error('Error deleting file from storage:', storageError);
                            // Continue anyway - we'll keep it in our blacklist
                          } else {
                            console.log('Successfully deleted from storage:', path);
                          }
                          
                          // Also delete any associated transcription data
                          const { error: dbError } = await supabase
                            .from('meeting_transcriptions')
                            .delete()
                            .eq('audio_url', meeting.url);
                            
                          if (dbError) {
                            console.error('Error deleting transcription data:', dbError);
                          } else {
                            console.log('Successfully deleted transcription data for:', meeting.url);
                          }
                          
                          // Remove from localStorage as well
                          const storageKey = `meeting_transcription_${encodeURIComponent(meeting.url)}`;
                          localStorage.removeItem(storageKey);
                          
                          // Force a complete refresh to ensure everything is in sync
                          setTimeout(() => {
                            setRefreshTrigger(prev => prev + 1);
                          }, 500);
                          
                          toast.success('Meeting deleted successfully');
                        } catch (err) {
                          console.error('Error deleting meeting:', err);
                          toast.error('Failed to delete meeting. Please try again.');
                          
                          // Even if there's an error, keep the meeting in our blacklist
                          // to prevent it from reappearing
                        }
                      }
                    }}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Delete Meeting
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
