import {
  StyleSheet,
  Text,
  Keyboard,
  View,
  TextInput as NativeTextInput,
  TouchableOpacity,
} from 'react-native';
import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useRef,
} from 'react';
import CustomIcon, { ICON_TYPE } from './CustomIcon';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../helper/responsiveSize';
import { colors } from '../resources/colors';
 
const CustomInput = forwardRef(
  (
    {
      label,
      placeholder = 'Enter your text',
      multiline = false,
      editable = true,
      value,
      readOnly,
      onChangeText,
      labelColor,
      error = false,
      secureTextEntry,
      lableStyle = {
        fontWeight: '500',
        fontSize: textScale(14),
        color: colors.textColor,
        marginBottom: moderateScaleVertical(5),
        textTransform: 'capitalize',
        ...lableStyle
      },
      style,
      errorText = '',
      rightIcon,
      leftIcon,
      keyboardType,
      onSubmitEditing,
      search = false,
      onSearchPress = () => {},
      clearable = false,
      errorStyle = {
        fontSize: textScale(12),
        color: colors.danger,
        marginTop:moderateScale(5)
      },
      ...rest
    },
    ref,
  ) => {
    const [showPass, setShowPass] = useState(false);
    const inputRef = useRef(); // Internal ref
    const styles = useStyles(multiline);
 
    // Properly expose the inner ref to parent
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus?.(),
      blur: () => inputRef.current?.blur?.(),
      measureLayout: (...args) => inputRef.current?.measureLayout?.(...args),
      // Add more methods if needed
      getNode: () => inputRef.current,
    }));
    
 
    return (
      <View style={{ marginBottom: moderateScaleVertical(15) }}>
        {label ? <Text style={[lableStyle,{color:labelColor?? colors.black}]}>{label}</Text> : null}
 
        <View
          style={[
            styles.inputContainer,
            style,
            error && { borderColor: colors.danger },
          ]}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
 
          <NativeTextInput
            ref={inputRef}
            readOnly={readOnly}
            placeholder={placeholder}
            placeholderTextColor={colors.textColor}
            secureTextEntry={secureTextEntry && !showPass}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            multiline={multiline}
            onSubmitEditing={onSubmitEditing}
            keyboardType={keyboardType}
            lableStyle={lableStyle}
            style={[
              styles.input,
              multiline && { height: moderateScaleVertical(100) },
              leftIcon && { paddingLeft: 0 },
            ]}
            {...rest}
          />
 
          {secureTextEntry && (
            <TouchableOpacity
              style={styles.iconRight}
              onPress={() => {
                Keyboard.dismiss();
                setShowPass(!showPass);
              }}>
              <CustomIcon
                origin={ICON_TYPE.IONICONS}
                name={showPass ? 'eye' : 'eye-off'}
                color="gray"
                size={18}
              />
            </TouchableOpacity>
          )}

          {clearable && editable && value != null && String(value).length > 0 && (
            <TouchableOpacity
              style={styles.iconRight}
              onPress={() => onChangeText?.('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CustomIcon
                origin={ICON_TYPE.IONICONS}
                name="close-circle"
                color="#9CA3AF"
                size={20}
              />
            </TouchableOpacity>
          )}
 
          {search && rightIcon && !clearable && (
            <TouchableOpacity
              style={styles.iconRight}
              onPress={onSearchPress}>
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
 
        {error ? <Text style={errorStyle}>{errorText}</Text> : null}
      </View>
    );
  },
);
 
export default CustomInput;
 
const useStyles = multiline =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.textColor,
      borderRadius: 12,
      paddingHorizontal: moderateScale(10),
      height: multiline ? undefined : moderateScaleVertical(50),
    },
    input: {
      flex: 1,
      fontSize: textScale(12),
      color: colors.black,
      paddingVertical: moderateScaleVertical(10),
      textAlignVertical: multiline ? 'top' : 'center',
    },
    iconLeft: {
      marginRight: moderateScale(8),
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconRight: {
      marginLeft: moderateScale(8),
      justifyContent: 'center',
      alignItems: 'center',
    },
  });