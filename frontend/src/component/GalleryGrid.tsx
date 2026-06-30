import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { requestGalleryPermission } from '../utils/permissions';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

interface GalleryGridProps {
  onSelect: (uri: string) => void;
  selectedUris?: string[];
}

interface PhotoItem {
  id: string;
  uri: string;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ onSelect, selectedUris }) => {
  const { theme } = useTheme();
  
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [after, setAfter] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Check and request permission, then fetch initial photos
  const checkPermissionAndLoad = useCallback(async () => {
    setLoading(true);
    const hasPermission = await requestGalleryPermission();
    setPermissionGranted(hasPermission);
    
    if (hasPermission) {
      await fetchPhotos(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissionAndLoad();
  }, [checkPermissionAndLoad]);

  // Fetch photos from CameraRoll
  const fetchPhotos = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await CameraRoll.getPhotos({
        first: 30,
        after: reset ? undefined : after,
        assetType: 'Photos',
      });

      const newPhotos: PhotoItem[] = response.edges.map(edge => ({
        id: edge.node.timestamp.toString() + '_' + Math.random().toString(36).substr(2, 5),
        uri: edge.node.image.uri,
      }));

      if (reset) {
        setPhotos(newPhotos);
      } else {
        setPhotos(prev => [...prev, ...newPhotos]);
      }

      setAfter(response.page_info.end_cursor);
      setHasNextPage(response.page_info.has_next_page);
      setPermissionGranted(true);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPermissionGranted(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPhotos(true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasNextPage && after) {
      fetchPhotos(false);
    }
  };

  const renderPhotoItem = ({ item }: { item: PhotoItem }) => {
    const selectedUrisArray = selectedUris || [];
    const selectedIndex = selectedUrisArray.indexOf(item.uri);
    const isSelected = selectedIndex !== -1;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelect(item.uri)}
        style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, margin: SPACING }}
        className="relative"
      >
        <Image
          source={{ uri: item.uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        
        {/* Selection Indicator Badge */}
        {selectedUris !== undefined && (
          <View
            className={`absolute top-2 right-2 w-6 h-6 rounded-full border-[1.5px] border-white items-center justify-center ${
              isSelected ? 'bg-primary border-primary dark:bg-dark-primary dark:border-dark-primary' : 'bg-black/20'
            }`}
          >
            {isSelected ? (
              <Text className="text-white text-[11px] font-bold">{selectedIndex + 1}</Text>
            ) : (
              <View className="w-3.5 h-3.5 rounded-full" />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  if (permissionGranted === false) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-background dark:bg-backgroundDark">
        <Text className="text-base text-center mb-4 text-text-secondary dark:text-textDark">
          Permission is required to display your gallery.
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={checkPermissionAndLoad}
          className="py-3 px-6 rounded-lg bg-primary dark:bg-dark-primary"
        >
          <Text className="text-white text-base font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && photos.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-background dark:bg-secondaryDark">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View className="h-full bg-background dark:bg-secondaryDark">
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="flex-1 h-[300px] justify-center items-center">
              <Text className="text-base text-text-secondary dark:text-dark-text-secondary">
                No photos found in your gallery.
              </Text>
            </View>
          ) : null
        }
        columnWrapperStyle={{ justifyContent: 'flex-start' }}
      />
    </View>
  );
};

export default GalleryGrid;