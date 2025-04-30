import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Loader2, AlertCircle, User, Trash2, Undo2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Avatar from './Avatar';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type UserData = Database['public']['Tables']['users']['Row'];

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  updateUserData: (updates: Partial<UserData>) => Promise<void>;
  refreshUserData: () => void;
}

// 画像をリサイズする関数（大きすぎる画像をリサイズする）
async function resizeImageIfNeeded(file: File, maxSize: number = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      // 画像が十分小さい場合はそのまま返す
      if (img.width <= maxSize && img.height <= maxSize) {
        file.arrayBuffer().then(buffer => {
          resolve(new Blob([buffer], { type: file.type }));
        }).catch(reject);
        return;
      }
      
      // 大きい方の辺をmaxSizeに合わせてリサイズ
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        height = Math.floor(height * (maxSize / width));
        width = maxSize;
      } else {
        width = Math.floor(width * (maxSize / height));
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type,
        0.9
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
  });
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ 
  isOpen, 
  onClose, 
  userData,
  updateUserData,
  refreshUserData
}) => {
  const MAX_BIO_LENGTH = 200;
  const [editingName, setEditingName] = useState(userData.name || '');
  const [editingBio, setEditingBio] = useState(userData.bio || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAvatarMarkedForDeletion, setIsAvatarMarkedForDeletion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [initialName, setInitialName] = useState(userData.name || '');
  const [initialBio, setInitialBio] = useState(userData.bio || '');
  const [initialAvatarUrl, setInitialAvatarUrl] = useState(userData.avatar_url || null);

  useEffect(() => {
    if (userData) {
      setEditingName(userData.name || '');
      setEditingBio(userData.bio || '');
    }
  }, [userData]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (isOpen) {
      const currentName = userData.name || '';
      const currentBio = userData.bio || '';
      const currentAvatarUrl = userData.avatar_url || null;
      setInitialName(currentName);
      setInitialBio(currentBio);
      setInitialAvatarUrl(currentAvatarUrl);

      setEditingName(currentName);
      setEditingBio(currentBio);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsAvatarMarkedForDeletion(false);
      setError(null);
      setLoading(false);
    } else {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, userData]);

  // --- 変更検知用フラグ (関数スコープで定義) ---
  let isNameChanged = false;
  let isBioChanged = false;
  let isAvatarChanged = false;

  const isBioTooLong = editingBio.length > MAX_BIO_LENGTH;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setIsAvatarMarkedForDeletion(false);
    setPreviewUrl(null);
    setSelectedFile(null);

    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください。');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください。');
        return;
      }
      
      setSelectedFile(file);
      
      // プレビュー用のURLを作成
      const objectURL = URL.createObjectURL(file);
      setPreviewUrl(objectURL);
      
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleMarkForDeletion = () => {
    setError(null);
    setIsAvatarMarkedForDeletion(true);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUndoDeletion = () => {
    setIsAvatarMarkedForDeletion(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!userData) return;

    const nameChanged = editingName.trim() !== initialName;
    const bioChanged = editingBio.trim() !== initialBio;
    const avatarFileSelected = !!selectedFile;
    const avatarDeletionMarked = isAvatarMarkedForDeletion;

    const isAvatarChanged = avatarFileSelected || avatarDeletionMarked;

    if (!nameChanged && !bioChanged && !isAvatarChanged) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    const updates: Partial<UserData> = {};
    let storageError: Error | null = null;
    let deleteFilePath: string | null = null;

    try {
      if (avatarDeletionMarked) {
        updates.avatar_url = null;
        if (userData.avatar_url) {
          try {
            const url = new URL(userData.avatar_url);
            const pathSegments = url.pathname.split('/');
            const bucketIndex = pathSegments.indexOf('avatars');
            if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
              deleteFilePath = pathSegments.slice(bucketIndex + 1).join('/');
            }
          } catch (e) {
            // URLの解析に失敗した場合は削除をスキップ
          }
        }
      } else if (selectedFile) {
        // 必要に応じて画像をリサイズ
        const processedBlob = await resizeImageIfNeeded(selectedFile);
        
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'png';
        const filePath = `${userData.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, processedBlob, {
            contentType: selectedFile.type,
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${filePath}?t=${new Date().getTime()}`);
          
        if (!urlData || !urlData.publicUrl) throw new Error('Failed to get public URL');
        updates.avatar_url = urlData.publicUrl;
      }

      if (nameChanged) {
        if (!editingName.trim()) {
          throw new Error('名前は必須です。');
        }
        updates.name = editingName.trim();
      }

      if (bioChanged) {
        updates.bio = editingBio.trim();
      }

      if (Object.keys(updates).length > 0) {
        await updateUserData(updates);
      }

      if (deleteFilePath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([deleteFilePath]);
        if (deleteError && deleteError.message !== 'Not Found') {
          storageError = deleteError;
        }
      }

      refreshUserData();
      toast.success('プロフィールを更新しました');
      onClose();

    } catch (err: any) {
      const errorMessage = err.message || 'プロフィールの保存に失敗しました。';
      const finalError = storageError ? `${errorMessage}\nストレージファイルの削除にも失敗しました: ${storageError.message}` : errorMessage;
      setError(finalError);
      toast.error(finalError);
    } finally {
      setLoading(false);
    }
  };

  let displaySrc = userData.avatar_url;
  if (isAvatarMarkedForDeletion) {
    displaySrc = null;
  } else if (previewUrl) {
    displaySrc = previewUrl;
  }

  // --- レンダリング直前に変更状態を計算 ---
  isNameChanged = editingName.trim() !== initialName;
  isBioChanged = editingBio.trim() !== initialBio;
  const avatarDeletionMarked = isAvatarMarkedForDeletion;
  isAvatarChanged = !!selectedFile || (avatarDeletionMarked && !!initialAvatarUrl);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="プロフィール編集">
      <div className="p-4 space-y-6">
        <div className={`flex flex-col items-center space-y-3 p-3 rounded-md ${isAvatarChanged ? 'bg-teal-50' : ''}`}>
          <div className="w-36 h-36 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <Avatar 
              src={isAvatarMarkedForDeletion ? null : (previewUrl || userData.avatar_url)}
              name={editingName || userData.name}
              size={128}
            />
          </div>
          <div className="flex space-x-2">
            {!isAvatarMarkedForDeletion && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                icon={<UploadCloud className="h-4 w-4"/>}
              >
                {previewUrl ? '画像を変更' : '画像を選択'}
              </Button>
            )}
            
            {userData.avatar_url && !previewUrl && (
              isAvatarMarkedForDeletion ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndoDeletion}
                  disabled={loading}
                  icon={<Undo2 className="h-4 w-4"/>}
                >
                  削除を取り消し
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkForDeletion}
                  disabled={loading}
                  className="text-red-600 hover:bg-red-50 hover:border-red-300"
                  icon={<Trash2 className="h-4 w-4"/>}
                >
                  画像を削除
                </Button>
              )
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className={`p-2 rounded-md ${isNameChanged ? 'bg-teal-50' : ''}`}>
          <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <User className="h-4 w-4 mr-1 text-gray-500" />
            名前
          </label>
          <input
            id="profileName"
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
            placeholder="表示名"
            disabled={loading}
          />
        </div>

        <div className={`p-2 rounded-md ${isBioChanged ? 'bg-teal-50' : ''}`}>
          <label htmlFor="profileBio" className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>
              <FileText className="h-4 w-4 mr-1 text-gray-500 inline-block" />
              自己紹介
            </span>
            <span className={`text-xs ${isBioTooLong ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              {editingBio.length} / {MAX_BIO_LENGTH}
            </span>
          </label>
          <textarea
            id="profileBio"
            rows={3}
            value={editingBio}
            onChange={(e) => setEditingBio(e.target.value)}
            maxLength={MAX_BIO_LENGTH}
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50 ${isBioTooLong ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
            placeholder="自己紹介文を入力してください"
            disabled={loading}
            aria-describedby={isBioTooLong ? "bio-length-error" : undefined}
          />
          {isBioTooLong && (
            <p id="bio-length-error" className="text-xs text-red-600 mt-1">
              自己紹介は{MAX_BIO_LENGTH}文字以内で入力してください。
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-md text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="text-teal-600 border-teal-200 hover:bg-teal-50"
          >
            キャンセル
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={
              (!selectedFile && 
               editingName.trim() === (userData?.name || '') && 
               editingBio.trim() === (userData?.bio || '') &&
               !isAvatarMarkedForDeletion) || 
              loading
            }
            icon={loading ? <Loader2 className="animate-spin h-4 w-4" /> : undefined}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileEditModal; 