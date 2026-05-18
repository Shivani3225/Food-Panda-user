import React, { createContext, useCallback, useMemo, useState, useEffect, useRef, useContext } from 'react';
import Toast from 'react-native-toast-message';
import {
  getFavoriteRestaurants,
  getFavoriteProducts,
  toggleFavoriteRestaurant,
  toggleFavoriteProduct,
} from '../services/favoriteService';
import { debounce } from '../utils/debounce';
import { AuthContext, useAuth } from './AuthContext';

export const FavouritesContext = createContext({});

function normalizeFavourite(raw) {
  if (!raw) return null;

  const id = raw._id || raw.favouriteId || raw.id;
  if (!id) return null;

 
  const isProduct = raw.type === 'product' || raw.menuItemId || raw.itemId || raw.productId || raw.product || !raw.cuisines;

  const rawMenuItem = raw.menuItemId || raw.itemId || raw.productId || raw.product || raw.item || null;
  let menuItemId = rawMenuItem && typeof rawMenuItem === 'object'
    ? (rawMenuItem._id || rawMenuItem.id || null)
    : rawMenuItem;

  if (isProduct && !menuItemId) {
    menuItemId = id;
  }
  
  
  let restaurantId = null;
  if (raw.restaurantId) {
    if (typeof raw.restaurantId === 'object' && raw.restaurantId._id) {
      restaurantId = raw.restaurantId._id;
    } else if (typeof raw.restaurantId === 'string') {
      restaurantId = raw.restaurantId;
    }
  } else if (raw.restaurant?._id) {
    restaurantId = raw.restaurant._id;
  }


  let restaurantName = 'Restaurant';
  if (raw.restaurantId?.name) {
    restaurantName = typeof raw.restaurantId.name === 'object' 
      ? raw.restaurantId.name.en || raw.restaurantId.name.de || raw.restaurantId.name.ar || 'Restaurant'
      : raw.restaurantId.name;
  } else if (raw.restaurantName) {
    restaurantName = typeof raw.restaurantName === 'object'
      ? raw.restaurantName.en || raw.restaurantName.de || raw.restaurantName.ar || 'Restaurant'
      : raw.restaurantName;
  } else if (raw.restaurant?.name) {
    restaurantName = typeof raw.restaurant.name === 'object'
      ? raw.restaurant.name.en || raw.restaurant.name.de || raw.restaurant.name.ar || 'Restaurant'
      : raw.restaurant.name;
  }

  return {
    id: String(id),
 
    menuItemId: isProduct ? (menuItemId ?? null) : null,
    restaurantId: restaurantId,
    restaurantName: restaurantName,
    name: raw.name || 'Item',
    image: raw.image || raw.bannerImage || null,
    description: raw.description || '',
    price: raw.price ?? raw.basePrice ?? 0,
    basePrice: raw.basePrice ?? raw.price ?? 0,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    type: raw.type || (isProduct ? 'product' : 'restaurant'),
  };
}

export const FavouritesProvider = ({ children }) => {
  const [favourites, setFavourites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const pendingToggles = useRef(new Map());
  const authContext = useAuth() || {};
  const isAuthenticated = authContext?.isAuthenticated || false;


  const fetchFavourites = useCallback(async () => {
    // Prevent fetching if already loading or not authenticated
    if (isLoading || !isAuthenticated) {
      console.log('[FavouritesContext] Skipping fetch - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
      return;
    }
    
    console.log('[FavouritesContext] 📥 Fetching favorites...');
    try {
      setIsLoading(true);
      const [restaurants, products] = await Promise.all([
        getFavoriteRestaurants().catch((error) => {
          console.warn('[FavouritesContext] Error fetching favorite restaurants:', error?.message);
          return [];
        }),
        getFavoriteProducts().catch((error) => {
          console.warn('[FavouritesContext] Error fetching favorite products:', error?.message);
          return [];
        }),
      ]);

      const allFavorites = [
        ...restaurants.map(r => normalizeFavourite({ ...r, type: 'restaurant' })),
        ...products.map(p => normalizeFavourite({ ...p, type: 'product' })),
      ].filter(Boolean);

      setFavourites(allFavorites);
      setIsInitialized(true);
      console.log('[FavouritesContext] ✅ Favorites loaded:', allFavorites.length);
    } catch (error) {
      console.error('[FavouritesContext] Error fetching favorites:', error);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isAuthenticated]);

  // Clear favorites when user logs out
  const clearFavourites = useCallback(() => {
    console.log('[FavouritesContext] 🧹 Clearing favorites (logout)');
    setFavourites([]);
    setIsInitialized(false);
  }, []);

  // Fetch favorites when user logs in
  useEffect(() => {
    console.log('[FavouritesContext] Auth state changed - isAuthenticated:', isAuthenticated);
    
    if (isAuthenticated && !isInitialized) {
      console.log('[FavouritesContext] 🔄 User authenticated, fetching favorites...');
      fetchFavourites();
    } else if (!isAuthenticated) {
      console.log('[FavouritesContext] 🧹 User not authenticated, clearing favorites');
      clearFavourites();
    }
  }, [isAuthenticated, isInitialized, fetchFavourites, clearFavourites]);


  const isFavourite = useCallback(
    (id, type) => {
      const key = String(id ?? '');
      if (!key) return false;
      return favourites.some(f => {
        if (!f) return false;
        if (type === 'restaurant') {
          const favIsRestaurant = f.type === 'restaurant' || !f.menuItemId;
          return favIsRestaurant && String(f.restaurantId || f.id) === key;
        }
        if (type === 'product') {
          const favIsRestaurant = f.type === 'restaurant' || !f.menuItemId;
          return !favIsRestaurant && String(f.menuItemId || f.id) === key;
        }
        return f.id === key || f.restaurantId === key || f.menuItemId === key;
      });
    },
    [favourites],
  );

  
  const debouncedToggleAPI = useRef(
    debounce(async (id, type, isRestaurant, afterToggle) => {
      try {
        const apiCall = isRestaurant ? toggleFavoriteRestaurant : toggleFavoriteProduct;
        const result = await apiCall(id);
        
       
        pendingToggles.current.delete(`${type}:${id}`);

        
        afterToggle?.();
        
        return result;
      } catch (error) {
        console.error('Error toggling favorite:', error);
        
       
        const pendingState = pendingToggles.current.get(`${type}:${id}`);
        if (pendingState) {
          setFavourites(prev => {
            if (pendingState.wasAdded) {
              
              return prev.filter(f => f.id !== id && f.restaurantId !== id && f.menuItemId !== id);
            } else {
              
              return [pendingState.item, ...prev];
            }
          });
        }
        
        pendingToggles.current.delete(`${type}:${id}`);
        
        Toast.show({
          type: 'error',
          text1: 'Failed to update favorite',
          text2: error?.response?.data?.message || 'Please try again',
          position: 'bottom',
        });
        
        throw error;
      }
    }, 600)
  ).current;

  const addFavourite = useCallback(raw => {
    const fav = normalizeFavourite(raw);
    if (!fav) return;

    setFavourites(prev => {
      const exists = prev.some(x => x.id === fav.id);
      if (exists) return prev;
      return [fav, ...prev];
    });
  }, []);

  const removeFavourite = useCallback(id => {
    const key = String(id ?? '');
    setFavourites(prev => prev.filter(f => f.id !== key));
  }, []);

  const toggleFavourite = useCallback(
    (raw) => {
      const fav = normalizeFavourite(raw);
      if (!fav) return { added: false };

      const isRestaurant = fav.type === 'restaurant' || !fav.menuItemId;
      const targetId = isRestaurant
        ? (fav.restaurantId || fav.id)
        : (fav.menuItemId || fav.id);
      
      let added = false;
      let removedItem = null;

      const matchesTarget = (item) => {
        const itemIsRestaurant = item?.type === 'restaurant' || !item?.menuItemId;
        if (isRestaurant) {
          return itemIsRestaurant && String(item.restaurantId || item.id) === String(targetId);
        }
        return !itemIsRestaurant && String(item.menuItemId || item.id) === String(targetId);
      };

      
      setFavourites(prev => {
        const exists = prev.some(matchesTarget);
        
        if (exists) {
          added = false;
          removedItem = prev.find(matchesTarget);
          return prev.filter(x => !matchesTarget(x));
        }
        added = true;
        return [fav, ...prev];
      });

      
      pendingToggles.current.set(`${fav.type}:${targetId}`, {
        wasAdded: added,
        item: added ? fav : removedItem,
      });

      
      debouncedToggleAPI(targetId, fav.type, isRestaurant, fetchFavourites);

      return { added };
    },
    [debouncedToggleAPI, fetchFavourites],
  );

  const favouritesCount = useMemo(() => favourites.length, [favourites]);

  const value = useMemo(
    () => ({
      favourites,
      favouritesCount,
      isFavourite,
      addFavourite,
      removeFavourite,
      toggleFavourite,
      fetchFavourites,
      clearFavourites,
      isLoading,
      isInitialized,
    }),
    [
      favourites,
      favouritesCount,
      isFavourite,
      addFavourite,
      removeFavourite,
      toggleFavourite,
      fetchFavourites,
      clearFavourites,
      isLoading,
      isInitialized,
    ],
  );

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
};

export default FavouritesContext;
