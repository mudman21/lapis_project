import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/RequestPage.css';
import RequestList from '../components/RequestList';
import RequestForm from '../components/RequestForm';
import RequestDetail from '../components/RequestDetail';
import ErrorModal from '../components/ErrorModal';
import PasswordModal from '../components/PasswordModal';
import { useAuth } from '../AuthContext';

const fetchRequests = async (page) => {
  try {
    const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/requests?page=${page}&per_page=10`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

function RequestPage() {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [passwordProtectedRequestId, setPasswordProtectedRequestId] = useState(null);
    const { isLoggedIn } = useAuth();
    const location = useLocation();

    const refreshRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchRequests(currentPage);
            setRequests(data.requests);
            setTotalPages(data.total_pages);
        } catch (error) {
            setError('요청을 불러오는 데 실패했습니다. 나중에 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        refreshRequests();
    }, [refreshRequests]);

    useEffect(() => {
        setSelectedRequest(null);
    }, [location]);

    const handleRequestSelect = async (request) => {
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/requests/${request.id}`, {
                credentials: 'include'
            });
            if (response.status === 403) {
                setShowPasswordModal(true);
                setPasswordProtectedRequestId(request.id);
            } else if (response.ok) {
                const fullRequestData = await response.json();
                setSelectedRequest(fullRequestData);
            } else {
                throw new Error('Failed to fetch request details');
            }
            setIsFormVisible(false);
        } catch (error) {
            console.error('Error fetching full request details:', error);
            setError(error.message);
        }
    };
    
    const handlePasswordSubmit = async (password) => {
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/requests/${passwordProtectedRequestId}?password=${encodeURIComponent(password)}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setSelectedRequest(data);
                setShowPasswordModal(false);
            } else {
                const errorData = await response.json();
                setError(errorData.error || '비밀번호가 올바르지 않습니다. 다시 시도해 주세요.');
            }
        } catch (error) {
            console.error('Error checking password:', error);
            setError('비밀번호 확인 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
    };

    const handleNewRequest = () => {
        setSelectedRequest(null);
        setIsFormVisible(true);
    };

    const handleRequestSubmit = async (newRequest) => {
        try {
            const response = await fetch('http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRequest),
                credentials: 'include'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '요청 제출에 실패했습니다');
            }
            const data = await response.json();
            console.log('New request submitted:', data);
            refreshRequests();
            setIsFormVisible(false);
        } catch (error) {
            console.error('Error submitting request:', error);
            setError(error.message);
        }
    };

    const handleRequestUpdate = async (updatedRequest) => {
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/requests/${updatedRequest.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedRequest),
                credentials: 'include'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '요청 업데이트에 실패했습니다');
            }
            const updatedData = await response.json();
            setRequests(requests.map(req => req.id === updatedData.id ? updatedData : req));
            setSelectedRequest(updatedData);
            await refreshRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            setError(error.message);
        }
    };

    const handleRequestDelete = async (requestId) => {
        try {
            const response = await fetch(`http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/requests/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            if (!response.ok) {
                const text = await response.text();
                console.error('Server response:', text);
                throw new Error('요청 삭제에 실패했습니다');
            }
            refreshRequests();
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error deleting request:', error);
            setError(error.message);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="request-page">
            <div className="request-page-header">
                <h1 className="request-page-title"></h1>
                <button className="new-request-btn" onClick={handleNewRequest}>
                    <i className="material-icons">add</i>
                    New
                </button>
            </div>
            
            {isFormVisible && (
                <RequestForm onSubmit={handleRequestSubmit} />
            )}

            {selectedRequest && !showPasswordModal ? (
                <RequestDetail
                    request={selectedRequest}
                    onUpdate={handleRequestUpdate}
                    onDelete={handleRequestDelete}
                    onBack={() => {
                        setSelectedRequest(null);
                        refreshRequests();
                    }}
                    isLoggedIn={isLoggedIn}
                />
            ) : (
                <RequestList
                    requests={requests}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onRequestSelect={handleRequestSelect}
                    isLoggedIn={isLoggedIn}
                />
            )}

            {showPasswordModal && (
                <PasswordModal 
                    onSubmit={handlePasswordSubmit}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setSelectedRequest(null);
                        setPasswordProtectedRequestId(null);
                    }}
                />
            )}
            
            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
        </div>
    );
}

export default RequestPage;