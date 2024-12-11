const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const AppError = require('./../utils/appError');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user,statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    },
  });
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  // Generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send email with reset link
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) has requested a password reset for your account.\n\n
  Please click on the following link to reset your password:\n${resetUrl}\n\n
  If you did not request this, please ignore this email and no changes will be made.`;

  console.log(user.email);
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      text: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Reset password email sent!',
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error trying to reset your password', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user by reset token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid token or token expired', 400));
  }

  // Hash new password
  // const hashedPassword = await bcrypt.hash(req.body.password, 12);

  // Update user password and reset fields
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  createSendToken(user,200,res);
  // const token = signToken(user._id);

  // // Send response
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.protect = catchAsync(async (req, res, next) => {
  const { authorization } = req.headers;

  // Check if token is there
  if (!authorization || !authorization.startsWith('Bearer')) {
    return next(new AppError('Authorization token is missing', 401));
  }

  // Get token from authorization header
  const token = authorization.split(' ')[1];

  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  if (!decoded || !(await User.findById(decoded.id))) {
    return next(new AppError('Token is invalid or user no longer exists', 401));
  }

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User has changed password. Please log in again', 401)
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Unauthorized to access this route', 403));
    }
    next();
  };
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  
  createSendToken(newUser,201,res);
  
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }


  createSendToken(user,200,res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('Invalid token', 400));
  }

  // Check if current password is correct
  const correctCurrentPassword = await bcrypt.compare(
    req.body.currentPassword,
    user.password
  );

  if (!correctCurrentPassword) {
    return next(new AppError('Current password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // Generate new JWT

  createSendToken(user,200,res);
});
