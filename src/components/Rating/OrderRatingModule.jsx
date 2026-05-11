// import React, { useState, useCallback, useMemo } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import Toast from 'react-native-toast-message';
// import { ChevronDown, ChevronUp } from 'lucide-react-native';
// import { useTranslation } from 'react-i18next';
// import RatingStars from './RatingStars';
// import ImageUploader from './ImageUploader';
// import FeedbackInput from './FeedbackInput';
// import IssueSelector from './IssueSelector';
// import {
//   rateOrder,
//   rateRestaurant,
//   rateRider,
//   reportOrderIssue,
//   uploadOrderPhotos,
// } from '../../services/orderService';
// import { scale } from '../../utils/scale';
// import { FONT_SIZES } from '../../theme/typography';
// import { SPACING } from '../../theme/spacing';

// const OrderRatingModule = ({ order, onSuccess }) => {
//   const { t } = useTranslation();
//   const [ratingExpanded, setRatingExpanded] = useState(false);
//   const [issueExpanded, setIssueExpanded] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   // Rating states
//   const [orderRating, setOrderRating] = useState(0);
//   const [restaurantRating, setRestaurantRating] = useState(0);
//   const [riderRating, setRiderRating] = useState(0);

//   // Feedback & Photos
//   const [feedback, setFeedback] = useState('');
//   const [images, setImages] = useState([]);

//   // Issue reporting
//   const [selectedIssue, setSelectedIssue] = useState(null);
//   const [issueDescription, setIssueDescription] = useState('');

//   // Already submitted flags
//   const [hasRated, setHasRated] = useState(false);
//   const [hasReported, setHasReported] = useState(false);

//   const orderId = order?.id || order?._id;
//   const restaurantId = order?.restaurant?._id;
//   const riderId = order?.rider?._id || order?.deliveryAgent?._id;

//   // Ensure orderId is present before proceeding with any submission
//   if (!orderId) {
//     console.error('❌ [OrderRatingModule] Order ID is missing. Cannot submit rating or report issue.');
//     Toast.show({
//       type: 'error',
//       text1: t('common.error', 'Error'),
//       text2: t('order_rating.missing_order_id', 'Order ID is missing. Cannot submit rating or report issue.'),
//     });
//     return null; // Or handle this case by disabling the module
//   }

//   const canSubmitRating = useMemo(() => {
//     return orderRating > 0 || restaurantRating > 0 || riderRating > 0;
//   }, [orderRating, restaurantRating, riderRating]);

//   const handleSubmitRating = async () => {
//     if (!canSubmitRating) {
//       Alert.alert(
//         t('order_rating.rating_required_title', 'Rating Required'),
//         t('order_rating.rating_required_message', 'Please provide at least one rating before submitting.')
//       );
//       return;
//     }

//     if (orderRating > 0 && !feedback.trim()) {
//       Alert.alert(
//         t('order_rating.feedback_required_title', 'Feedback Required'),
//         t('order_rating.feedback_required_message', 'Please share your feedback along with the rating.')
//       );
//       return;
//     }

//     setSubmitting(true);

//     try {
//       const promises = [];

//       // Upload Photos first if any, ensuring orderId is available
//       if (images.length > 0) {
//         console.log('📤 [OrderRatingModule] Preparing to upload photos for order:', orderId, 'Images count:', images.length);
//         promises.push(uploadOrderPhotos(orderId, images));
//       }

//       // Rate Order, ensuring orderId is available
//       // Rate Order
//       if (canSubmitRating) {
//         console.log('📤 [OrderRatingModule] Preparing to submit overall order rating:', orderId);
//         promises.push(
//           rateOrder(orderId, {
//             restaurantRating: restaurantRating,
//             riderRating: riderRating,
//             comment: feedback.trim(),
//           })
//         );
//       }

//       // Rate Restaurant
//       if (restaurantRating > 0 && restaurantId) {
//         console.log('📤 [OrderRatingModule] Preparing to submit restaurant rating for restaurant:', restaurantId, 'Rating:', restaurantRating, 'Order ID:', orderId);
//         promises.push(
//           rateRestaurant(restaurantId, {
//             restaurantRating: restaurantRating,
//             orderId: orderId,
//           })
//         );
//       }

//       // Rate Rider
//       if (riderRating > 0 && riderId) {
//         console.log('📤 [OrderRatingModule] Preparing to submit rider rating for rider:', riderId, 'Rating:', riderRating, 'Order ID:', orderId);
//         promises.push(
//           rateRider(riderId, {
//             riderRating: riderRating,
//             orderId: orderId,
//           })
//         );
//       }

//       await Promise.all(promises);

//       setHasRated(true);
//       setRatingExpanded(false);

//       Toast.show({
//         type: 'success',
//         text1: t('order_rating.thank_you_title', 'Thank You!'),
//         text2: t('order_rating.feedback_submitted', 'Your feedback has been submitted successfully.'),
//         position: 'top',
//       });

//       if (onSuccess) {
//         onSuccess();
//       }
//     } catch (error) {
//       console.error('Rating submission error:', error);
//       const errorMessage =
//         error?.response?.data?.message ||
//         error?.message ||
//         t('order_rating.submission_failed', 'Failed to submit rating. Please try again.');
      
//       Toast.show({
//         type: 'error',
//         text1: t('order_rating.submission_failed_title', 'Submission Failed'),
//         text2: errorMessage,
//         position: 'top',
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleReportIssue = async () => {
//     if (!selectedIssue) {
//       Alert.alert(
//         t('order_rating.issue_required_title', 'Issue Type Required'),
//         t('order_rating.issue_required_message', 'Please select the type of issue you faced.')
//       );
//       return;
//     }

//     setSubmitting(true);

//     try {
//       console.log('📤 [OrderRatingModule] Preparing to report issue for order:', orderId, 'Issue Type:', selectedIssue, 'Description length:', issueDescription.trim().length);
//       await reportOrderIssue(orderId, {
//         issueType: selectedIssue,
//         description: issueDescription.trim(),
//       });

//       setHasReported(true);
//       setSelectedIssue(null);
//       setIssueDescription('');

//       Toast.show({
//         type: 'success',
//         text1: t('order_rating.issue_reported_title', 'Issue Reported ✅'),
//         text2: t('order_rating.issue_reported_message', 'We will look into this and get back to you soon.'),
//         position: 'top',
//         visibilityTime: 3000,
//       });

//       if (onSuccess) {
//         onSuccess();
//       }
//     } catch (error) {
//       console.error('Issue reporting error:', error);
//       const errorMessage =
//         error?.response?.data?.message ||
//         error?.message ||
//         t('order_rating.issue_report_failed', 'Failed to report issue. Please try again.');
      
//       Toast.show({
//         type: 'error',
//         text1: t('order_rating.submission_failed_title', 'Submission Failed'),
//         text2: errorMessage,
//         position: 'top',
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (order?.status !== 'delivered') {
//     return null;
//   }

//   return (
//     <View style={styles.mainContainer}>
//       {/* RATING SECTION */}
//       <View style={styles.card}>
//         <TouchableOpacity
//           style={styles.header}
//           onPress={() => setRatingExpanded(!ratingExpanded)}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.headerTitle}>
//             {hasRated 
//               ? t('order_rating.rating_submitted', '✓ Rating Submitted')
//               : t('order_rating.rate_experience', '⭐ Rate Your Experience')}
//           </Text>
//           {ratingExpanded ? (
//             <ChevronUp size={20} color="#E53935" strokeWidth={2.5} />
//           ) : (
//             <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
//           )}
//         </TouchableOpacity>

//         {ratingExpanded && !hasRated && (
//           <View style={styles.content}>
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               nestedScrollEnabled={true}
//             >
//               {/* Rating Stars */}
//               <View style={styles.ratingsGrid}>
//                 <RatingStars
//                   rating={orderRating}
//                   onRatingChange={setOrderRating}
//                   label={t('order_rating.overall_experience', 'Overall Experience')}
//                   size={28}
//                   containerStyle={styles.compactRating}
//                 />

//                 {restaurantId && (
//                   <RatingStars
//                     rating={restaurantRating}
//                     onRatingChange={setRestaurantRating}
//                     label={t('order_rating.restaurant', 'Restaurant')}
//                     size={28}
//                     containerStyle={styles.compactRating}
//                   />
//                 )}

//                 {riderId && (
//                   <RatingStars
//                     rating={riderRating}
//                     onRatingChange={setRiderRating}
//                     label={t('order_rating.delivery_rider', 'Delivery Rider')}
//                     size={28}
//                     containerStyle={styles.compactRating}
//                   />
//                 )}
//               </View>

//               {/* Feedback */}
//               <FeedbackInput
//                 value={feedback}
//                 onChangeText={setFeedback}
//                 required={orderRating > 0}
//                 maxLength={300}
//               />

//               {/* Photos */}
//               <ImageUploader
//                 images={images}
//                 onImagesChange={setImages}
//                 maxImages={5}
//               />

//               {/* Submit Button */}
//               <TouchableOpacity
//                 style={[
//                   styles.submitButton,
//                   (!canSubmitRating || submitting) && styles.submitButtonDisabled,
//                 ]}
//                 onPress={handleSubmitRating}
//                 disabled={!canSubmitRating || submitting}
//                 activeOpacity={0.8}
//               >
//                 {submitting ? (
//                   <ActivityIndicator size="small" color="#FFFFFF" />
//                 ) : (
//                   <Text style={styles.submitButtonText}>
//                     {t('order_rating.submit_rating', 'Submit Rating')}
//                   </Text>
//                 )}
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         )}

//         {hasRated && (
//           <View style={styles.successMessage}>
//             <Text style={styles.successText}>
//               {t('order_rating.thank_you_feedback', '✓ Thank you for your feedback!')}
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* REPORT ISSUE SECTION */}
//       <View style={styles.card}>
//         <TouchableOpacity
//           style={styles.header}
//           onPress={() => setIssueExpanded(!issueExpanded)}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.headerTitle}>
//             {hasReported 
//               ? t('order_rating.issue_reported_status', '✓ Issue Reported')
//               : t('order_rating.report_issue', '🚨 Report an Issue')}
//           </Text>
//           {issueExpanded ? (
//             <ChevronUp size={20} color="#FF6B00" strokeWidth={2.5} />
//           ) : (
//             <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
//           )}
//         </TouchableOpacity>

//         {issueExpanded && !hasReported && (
//           <View style={styles.content}>
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               nestedScrollEnabled={true}
//             >
//               <IssueSelector
//                 selectedIssue={selectedIssue}
//                 onIssueSelect={setSelectedIssue}
//                 description={issueDescription}
//                 onDescriptionChange={setIssueDescription}
//               />

//               <TouchableOpacity
//                 style={[
//                   styles.submitButton,
//                   styles.reportButton,
//                   (!selectedIssue || submitting) && styles.submitButtonDisabled,
//                 ]}
//                 onPress={handleReportIssue}
//                 disabled={!selectedIssue || submitting}
//                 activeOpacity={0.8}
//               >
//                 {submitting ? (
//                   <ActivityIndicator size="small" color="#FFFFFF" />
//                 ) : (
//                   <Text style={styles.submitButtonText}>
//                     {t('order_rating.report_issue_button', 'Report Issue')}
//                   </Text>
//                 )}
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         )}

//         {hasReported && (
//           <View style={styles.successMessage}>
//             <Text style={styles.successText}>
//               {t('order_rating.issue_looked_into', "✓ We'll look into this soon!")}
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   mainContainer: {
//     marginHorizontal: SPACING.lg,
//     marginTop: SPACING.md,
//     marginBottom: SPACING.xl,
//     gap: SPACING.lg,
//   },
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: scale(14),
//     borderWidth: 0,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: SPACING.lg,
//     paddingVertical: scale(16),
//     backgroundColor: '#FAFAFA',
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   },
//   headerTitle: {
//     fontSize: FONT_SIZES.md,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     flex: 1,
//     letterSpacing: -0.3,
//   },
//   content: {
//     padding: SPACING.lg,
//     maxHeight: scale(520),
//     backgroundColor: '#FEFEFE',
//   },
//   ratingsGrid: {
//     marginBottom: SPACING.lg,
//     backgroundColor: '#FFFFFF',
//     borderRadius: scale(12),
//     padding: SPACING.sm,
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//   },
//   compactRating: {
//     paddingVertical: scale(14),
//     borderBottomWidth: 1,
//     borderBottomColor: '#F8F8F8',
//   },
//   submitButton: {
//     backgroundColor: '#E53935',
//     paddingVertical: scale(14),
//     borderRadius: scale(12),
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: SPACING.lg,
//     minHeight: scale(50),
//     shadowColor: '#E53935',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   submitButtonDisabled: {
//     backgroundColor: '#D0D0D0',
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   reportButton: {
//     backgroundColor: '#ed1c24',
//     shadowColor: '#ed1c24',
//   },
//   submitButtonText: {
//     fontSize: FONT_SIZES.md,
//     fontWeight: '700',
//     color: '#FFFFFF',
//     letterSpacing: 0.5,
//   },
//   successMessage: {
//     paddingHorizontal: SPACING.lg,
//     paddingVertical: scale(16),
//     backgroundColor: '#F0FDF4',
//     borderTopWidth: 2,
//     borderTopColor: '#86EFAC',
//   },
//   successText: {
//     fontSize: FONT_SIZES.sm,
//     fontWeight: '600',
//     color: '#16A34A',
//     textAlign: 'center',
//     letterSpacing: 0.2,
//   },
// });

// export default OrderRatingModule;
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import RatingStars from './RatingStars';
import ImageUploader from './ImageUploader';
import FeedbackInput from './FeedbackInput';
import IssueSelector from './IssueSelector';
import {
  rateOrder,
  rateRestaurant,
  rateRider,
  reportOrderIssue,
  uploadOrderPhotos,
} from '../../services/orderService';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const OrderRatingModule = ({ order, onSuccess }) => {
  const { t } = useTranslation();
  const [ratingExpanded, setRatingExpanded] = useState(false);
  const [issueExpanded, setIssueExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Rating states
  const [orderRating, setOrderRating] = useState(0);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);

  // Feedback & Photos
  const [feedback, setFeedback] = useState('');
  const [images, setImages] = useState([]);

  // Issue reporting
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');

  // Already submitted flags
  // Initialize based on order object (if backend provides isRated flag)
  const [hasRated, setHasRated] = useState(order?.isRated || order?.rated || false);
  const [hasReported, setHasReported] = useState(false);

  const orderId = order?.id || order?._id;
  const restaurantId = order?.restaurant?._id;
  const riderId = order?.rider?._id || order?.deliveryAgent?._id;

  // Ensure orderId is present before proceeding with any submission
  if (!orderId) {
    console.error('❌ [OrderRatingModule] Order ID is missing. Cannot submit rating or report issue.');
    Toast.show({
      type: 'error',
      text1: t('common.error', 'Error'),
      text2: t('order_rating.missing_order_id', 'Order ID is missing. Cannot submit rating or report issue.'),
    });
    return null; // Or handle this case by disabling the module
  }

  const canSubmitRating = useMemo(() => {
    return orderRating > 0 || restaurantRating > 0 || riderRating > 0;
  }, [orderRating, restaurantRating, riderRating]);

  const handleSubmitRating = async () => {
    if (!canSubmitRating) {
      Alert.alert(
        t('order_rating.rating_required_title', 'Rating Required'),
        t('order_rating.rating_required_message', 'Please provide at least one rating before submitting.')
      );
      return;
    }

    if (orderRating > 0 && !feedback.trim()) {
      Alert.alert(
        t('order_rating.feedback_required_title', 'Feedback Required'),
        t('order_rating.feedback_required_message', 'Please share your feedback along with the rating.')
      );
      return;
    }

    setSubmitting(true);

    // Log the complete rating data being submitted
    console.log('🚀 [OrderRatingModule] Submitting Ratings:', {
      orderId,
      overallOrderRating: orderRating,
      restaurantRating,
      riderRating,
      feedback: feedback.trim(),
      imagesCount: images.length
    });

    try {
      const promises = [];

      // Upload Photos first if any, ensuring orderId is available
      if (images.length > 0) {
        console.log('📤 [OrderRatingModule] Preparing to upload photos for order:', orderId, 'Images count:', images.length);
        promises.push(uploadOrderPhotos(orderId, images));
      }

      // Rate Order - Final API call with restaurantRating, riderRating, and comment
      if (canSubmitRating) {
        const orderPayload = {
          restaurantRating: restaurantRating > 0 ? restaurantRating : orderRating,
          riderRating: riderRating,
          comment: feedback.trim(),
        };
        console.log('📑 [OrderRatingModule] Calling rateOrder with payload:', orderPayload);
        promises.push(
          rateOrder(orderId, orderPayload)
        );
      }

      // Rate Restaurant
      if (restaurantRating > 0 && restaurantId) {
        console.log('📤 [OrderRatingModule] Preparing to submit restaurant rating for restaurant:', restaurantId, 'Rating:', restaurantRating, 'Order ID:', orderId);
        promises.push(
          rateRestaurant(restaurantId, {
            restaurantRating: restaurantRating,
            orderId: orderId,
          })
        );
      }

      // Rate Rider
      if (riderRating > 0 && riderId) {
        console.log('🛵 [OrderRatingModule] Calling rateRider for rider:', riderId, 'Rating:', riderRating);
        promises.push(
          rateRider(riderId, {
            riderRating: riderRating,
            orderId: orderId,
          })
        );
      }

      await Promise.all(promises);
      console.log('✅ [OrderRatingModule] All ratings submitted successfully');

      setHasRated(true);
      setRatingExpanded(false);

      Toast.show({
        type: 'success',
        text1: t('order_rating.thank_you_title', 'Thank You!'),
        text2: t('order_rating.feedback_submitted', 'Your feedback has been submitted successfully.'),
        position: 'top',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Agar backend bole ki order pehle se rated hai, toh UI update kar dein
      if (error?.response?.data?.message === 'Order already rated') {
        console.log('✅ [OrderRatingModule] Order already rated, updating UI state.');
        Toast.show({
          type: 'info',
          text1: t('common.info', 'Information'),
          text2: t('order_rating.thank_you_feedback', 'Thank you for your feedback!'),
          position: 'top',
        });
        
        setHasRated(true);
        setRatingExpanded(false);
        if (onSuccess) onSuccess();
        return;
      }

      // For all other errors, log and show a toast
      console.error('Rating submission error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('order_rating.submission_failed', 'Failed to submit rating. Please try again.');
      
      Toast.show({
        type: 'error',
        text1: t('order_rating.submission_failed_title', 'Submission Failed'),
        text2: errorMessage,
        position: 'top',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedIssue) {
      Alert.alert(
        t('order_rating.issue_required_title', 'Issue Type Required'),
        t('order_rating.issue_required_message', 'Please select the type of issue you faced.')
      );
      return;
    }

    setSubmitting(true);

    try {
      console.log('📤 [OrderRatingModule] Preparing to report issue for order:', orderId, 'Issue Type:', selectedIssue, 'Description length:', issueDescription.trim().length);
      await reportOrderIssue(orderId, {
        issueType: selectedIssue,
        description: issueDescription.trim(),
      });

      setHasReported(true);
      setSelectedIssue(null);
      setIssueDescription('');

      Toast.show({
        type: 'success',
        text1: t('order_rating.issue_reported_title', 'Issue Reported ✅'),
        text2: t('order_rating.issue_reported_message', 'We will look into this and get back to you soon.'),
        position: 'top',
        visibilityTime: 3000,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Issue reporting error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('order_rating.issue_report_failed', 'Failed to report issue. Please try again.');
      
      Toast.show({
        type: 'error',
        text1: t('order_rating.submission_failed_title', 'Submission Failed'),
        text2: errorMessage,
        position: 'top',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (order?.status !== 'delivered') {
    return null;
  }

  return (
    <View style={styles.mainContainer}>
      {/* RATING SECTION */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setRatingExpanded(!ratingExpanded)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle}>
            {hasRated 
              ? t('order_rating.rating_submitted', '✓ Rating Submitted')
              : t('order_rating.rate_experience', '⭐ Rate Your Experience')}
          </Text>
          {ratingExpanded ? (
            <ChevronUp size={20} color="#E53935" strokeWidth={2.5} />
          ) : (
            <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        {ratingExpanded && !hasRated && (
          <View style={styles.content}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {/* Rating Stars */}
              <View style={styles.ratingsGrid}>
                <RatingStars
                  rating={orderRating}
                  onRatingChange={setOrderRating}
                  label={t('order_rating.overall_experience', 'Overall Experience')}
                  size={28}
                  containerStyle={styles.compactRating}
                />

                {restaurantId && (
                  <RatingStars
                    rating={restaurantRating}
                    onRatingChange={setRestaurantRating}
                    label={t('order_rating.restaurant', 'Restaurant')}
                    size={28}
                    containerStyle={styles.compactRating}
                  />
                )}

                {riderId && (
                  <RatingStars
                    rating={riderRating}
                    onRatingChange={setRiderRating}
                    label={t('order_rating.delivery_rider', 'Delivery Rider')}
                    size={28}
                    containerStyle={styles.compactRating}
                  />
                )}
              </View>

              {/* Feedback */}
              <FeedbackInput
                value={feedback}
                onChangeText={setFeedback}
                required={orderRating > 0}
                maxLength={300}
              />

              {/* Photos */}
              <ImageUploader
                images={images}
                onImagesChange={setImages}
                maxImages={5}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!canSubmitRating || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitRating}
                disabled={!canSubmitRating || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t('order_rating.submit_rating', 'Submit Rating')}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {hasRated && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              {t('order_rating.thank_you_feedback', '✓ Thank you for your feedback!')}
            </Text>
          </View>
        )}
      </View>

      {/* REPORT ISSUE SECTION */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setIssueExpanded(!issueExpanded)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle}>
            {hasReported 
              ? t('order_rating.issue_reported_status', '✓ Issue Reported')
              : t('order_rating.report_issue', '🚨 Report an Issue')}
          </Text>
          {issueExpanded ? (
            <ChevronUp size={20} color="#FF6B00" strokeWidth={2.5} />
          ) : (
            <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        {issueExpanded && !hasReported && (
          <View style={styles.content}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <IssueSelector
                selectedIssue={selectedIssue}
                onIssueSelect={setSelectedIssue}
                description={issueDescription}
                onDescriptionChange={setIssueDescription}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  styles.reportButton,
                  (!selectedIssue || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleReportIssue}
                disabled={!selectedIssue || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t('order_rating.report_issue_button', 'Report Issue')}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {hasReported && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              {t('order_rating.issue_looked_into', "✓ We'll look into this soon!")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(14),
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: scale(16),
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    letterSpacing: -0.3,
  },
  content: {
    padding: SPACING.lg,
    maxHeight: scale(520),
    backgroundColor: '#FEFEFE',
  },
  ratingsGrid: {
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  compactRating: {
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  submitButton: {
    backgroundColor: '#E53935',
    paddingVertical: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    minHeight: scale(50),
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D0D0D0',
    shadowOpacity: 0,
    elevation: 0,
  },
  reportButton: {
    backgroundColor: '#ed1c24',
    shadowColor: '#ed1c24',
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  successMessage: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: scale(16),
    backgroundColor: '#F0FDF4',
    borderTopWidth: 2,
    borderTopColor: '#86EFAC',
  },
  successText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#16A34A',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default OrderRatingModule;