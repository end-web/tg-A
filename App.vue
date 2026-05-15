<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	@import './static/styles/apple-theme.css';

	page {
		background-color: #FFF8F5;
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
		font-size: 15px;
		color: #2D2D3A;
		box-sizing: border-box;
	}

	view, text, image, input, textarea, button {
		box-sizing: border-box;
	}
</style>
